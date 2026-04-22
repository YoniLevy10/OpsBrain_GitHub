-- OpsBrain v4: full schema upgrades (automations, chat channels upgrades, notifications extras)
-- Run after:
--   - 20260419000000_init_opsbrain.sql
--   - 20260420000000_reference_doc_schema.sql
--   - 20260421120000_v3_contacts_finance_policies_realtime.sql
--   - 20260422000000_master_build_schema_columns.sql

-- ---------------------------------------------------------------------------
-- workspaces: onboarding flag (used by legacy WorkspaceProvider / AuthGuard flows)
-- ---------------------------------------------------------------------------
alter table public.workspaces
  add column if not exists onboarding_completed boolean not null default true;

update public.workspaces
set onboarding_completed = true
where onboarding_completed is null;

-- ---------------------------------------------------------------------------
-- automations
-- ---------------------------------------------------------------------------
create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  name text not null,
  trigger_type text not null,
  action_type text not null,
  config jsonb default '{}'::jsonb,
  is_active boolean default true,
  run_count int default 0,
  success_rate float default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.automations enable row level security;

drop policy if exists "workspace_members_automations" on public.automations;
create policy "workspace_members_automations" on public.automations
  for all to authenticated
  using (
    workspace_id in (
      select wm.workspace_id from public.workspace_members wm
      where wm.user_id = auth.uid()
    )
  )
  with check (
    workspace_id in (
      select wm.workspace_id from public.workspace_members wm
      where wm.user_id = auth.uid()
    )
  );

create index if not exists idx_automations_workspace_id on public.automations (workspace_id);

-- ---------------------------------------------------------------------------
-- channels upgrades (team chat)
-- ---------------------------------------------------------------------------
alter table public.channels
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade,
  add column if not exists description text,
  add column if not exists type text default 'channel',
  add column if not exists dm_peer_id uuid references auth.users(id) on delete cascade;

-- created_by exists in reference schema; ensure type matches and FK is correct
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'channels' and column_name = 'created_by'
  ) then
    -- If created_by references auth.users in older schema, that's ok; leave as-is.
    null;
  else
    alter table public.channels
      add column created_by uuid references auth.users(id) on delete set null;
  end if;
end $$;

create index if not exists idx_channels_workspace_id on public.channels (workspace_id);
create index if not exists idx_channels_dm_peer_id on public.channels (dm_peer_id);

-- Backfill workspace_id for legacy channels rows (best-effort via first message in channel)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'channels' and column_name = 'workspace_id'
  ) then
    -- PG < 13 has no aggregate min(uuid); min(text)::uuid is portable.
    execute $sql$
      update public.channels c
      set workspace_id = sub.workspace_id
      from (
        select m.channel_id, (min(m.workspace_id::text))::uuid as workspace_id
        from public.messages m
        where m.workspace_id is not null
        group by m.channel_id
      ) sub
      where c.id = sub.channel_id
        and c.workspace_id is null
    $sql$;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- workspace_members roles (already in reference schema; keep for safety)
-- ---------------------------------------------------------------------------
alter table public.workspace_members
  add column if not exists role text default 'member',
  add column if not exists status text default 'active',
  add column if not exists invited_email text,
  add column if not exists accepted_at timestamptz;

-- ---------------------------------------------------------------------------
-- notifications extras
-- ---------------------------------------------------------------------------
alter table public.notifications
  add column if not exists type text default 'info',
  add column if not exists link text;

-- ---------------------------------------------------------------------------
-- create default channel for new workspaces
-- ---------------------------------------------------------------------------
create or replace function public.create_default_channel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.channels (workspace_id, name, type, created_by)
  values (new.id, 'general', 'channel', new.owner_id);
  return new;
end;
$$;

drop trigger if exists on_workspace_created_default_channel on public.workspaces;
create trigger on_workspace_created_default_channel
  after insert on public.workspaces
  for each row execute function public.create_default_channel();

-- Ensure existing workspaces have a default channel (idempotent)
insert into public.channels (workspace_id, name, type, created_by)
select w.id, 'general', 'channel', w.owner_id
from public.workspaces w
where not exists (
  select 1 from public.channels c where c.workspace_id = w.id
);

-- ---------------------------------------------------------------------------
-- Realtime publication (optional; safe if missing)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'automations'
  ) then
    execute 'alter publication supabase_realtime add table public.automations';
  end if;
exception
  when undefined_object then
    raise notice 'supabase_realtime publication missing — enable Realtime in Dashboard';
  when duplicate_object then
    null;
end $$;

