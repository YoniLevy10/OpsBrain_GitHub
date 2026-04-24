-- OPSBRAIN: events table for Calendar
-- Created: 2026-04-24
--
-- Notes:
-- - MVP RLS here matches init migration style (authenticated RW).
-- - Tighten RLS later to workspace membership checks.

create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz,
  color text default 'indigo',
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_events_workspace on public.events (workspace_id);
create index if not exists idx_events_start_time on public.events (start_time);

alter table public.events enable row level security;

drop policy if exists authenticated_rw_events on public.events;
create policy authenticated_rw_events on public.events
  for all
  to authenticated
  using (true)
  with check (true);

