-- Master build: typed columns for tasks, documents, notifications (flat fields + backfill from jsonb)

alter table public.tasks
  add column if not exists created_by uuid references auth.users (id) on delete set null,
  add column if not exists description text;

alter table public.documents
  add column if not exists name text,
  add column if not exists uploaded_by uuid references auth.users (id) on delete set null,
  add column if not exists file_type text,
  add column if not exists size_bytes bigint,
  add column if not exists storage_path text;

-- Backfill from legacy jsonb only if the `data` column exists.
-- Some projects created `documents` without a `data` jsonb column.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'documents'
      and column_name = 'data'
  ) then
    execute $sql$
      update public.documents d
      set
        name = coalesce(d.name, nullif(trim(d.data->>'title'), '')),
        file_type = coalesce(d.file_type, nullif(trim(d.data->>'file_type'), '')),
        size_bytes = coalesce(d.size_bytes, nullif(d.data->>'file_size', '')::bigint),
        storage_path = coalesce(d.storage_path, nullif(trim(d.data->>'storage_path'), '')),
        uploaded_by = coalesce(d.uploaded_by, nullif(d.data->>'uploaded_by', '')::uuid)
      where d.storage_path is null and d.data is not null
    $sql$;
  end if;
end
$$;

alter table public.notifications
  add column if not exists user_id uuid references auth.users (id) on delete cascade,
  add column if not exists title text,
  add column if not exists body text,
  add column if not exists is_read boolean not null default false;

create index if not exists idx_notifications_user_id on public.notifications (user_id);

alter table public.notifications enable row level security;

drop policy if exists "notifications_user_rw" on public.notifications;
create policy "notifications_user_rw" on public.notifications
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
