-- OPSBRAIN: align user_workspace_states with SaaS multi-tenant UX
-- Created: 2026-04-24
--
-- Why:
-- - Earlier schema stored states as {workspace_id, data}
-- - App code expects per-user state: (user_id, active_workspace_id)
--
-- Safe to run multiple times.

create extension if not exists pgcrypto;

do $$
begin
  -- Add new columns if missing
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_workspace_states' and column_name = 'user_id'
  ) then
    alter table public.user_workspace_states add column user_id uuid;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_workspace_states' and column_name = 'active_workspace_id'
  ) then
    alter table public.user_workspace_states add column active_workspace_id uuid references public.workspaces(id) on delete set null;
  end if;

  -- Ensure updated_at exists (some older schemas may differ)
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_workspace_states' and column_name = 'updated_at'
  ) then
    alter table public.user_workspace_states add column updated_at timestamptz not null default now();
  end if;

  -- Backfill from jsonb data if possible: data.user_id / data.active_workspace_id
  update public.user_workspace_states
  set
    user_id = coalesce(user_id, nullif((data->>'user_id')::uuid, null)),
    active_workspace_id = coalesce(active_workspace_id, nullif((data->>'active_workspace_id')::uuid, null))
  where data is not null
    and (
      user_id is null and (data ? 'user_id')
      or active_workspace_id is null and (data ? 'active_workspace_id')
    );

exception when others then
  -- If casting fails due to bad data, ignore and keep columns for new writes.
  raise notice 'user_workspace_states backfill skipped: %', sqlerrm;
end $$;

create unique index if not exists user_workspace_states_user_id_unique
  on public.user_workspace_states (user_id)
  where user_id is not null;

alter table public.user_workspace_states enable row level security;

drop policy if exists authenticated_rw_user_workspace_states on public.user_workspace_states;
create policy authenticated_rw_user_workspace_states on public.user_workspace_states
  for all
  to authenticated
  using (true)
  with check (true);

