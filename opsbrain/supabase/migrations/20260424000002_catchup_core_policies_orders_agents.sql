-- OPSBRAIN: catch-up migration (idempotent)
-- Created: 2026-04-24
--
-- Goal:
-- - Ensure core tables exist for the app (including demo "orders")
-- - Tighten critical RLS policies to workspace membership / auth.uid
-- - Ensure agent tables are protected (OpsAgent / Onboarding conversations)
--
-- Safe to run multiple times.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Orders (demo + Import/Export preset)
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  title text not null,
  supplier text,
  quantity int,
  status text not null default 'ordered',
  notes text,
  assigned_to uuid references auth.users (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'::jsonb
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_status_check'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_status_check
      check (status in ('ordered','negotiation','in_transit','customs','delivered','cancelled'));
  end if;
end $$;

create index if not exists idx_orders_workspace on public.orders (workspace_id);
create index if not exists idx_orders_status on public.orders (workspace_id, status);

alter table public.orders enable row level security;

drop policy if exists orders_workspace_member on public.orders;
create policy orders_workspace_member on public.orders
  for all
  to authenticated
  using (
    workspace_id in (
      select wm.workspace_id from public.workspace_members wm
      where wm.user_id = auth.uid() and wm.status = 'active'
    )
  )
  with check (
    workspace_id in (
      select wm.workspace_id from public.workspace_members wm
      where wm.user_id = auth.uid() and wm.status = 'active'
    )
  );

-- ---------------------------------------------------------------------------
-- Tighten RLS for previously "authenticated_rw_*" tables that must not be global
-- ---------------------------------------------------------------------------
-- workspaces: accessible to members (or owner)
alter table public.workspaces enable row level security;
drop policy if exists workspaces_member on public.workspaces;
create policy workspaces_member on public.workspaces
  for all
  to authenticated
  using (
    owner_id = auth.uid()
    or id in (
      select wm.workspace_id from public.workspace_members wm
      where wm.user_id = auth.uid() and wm.status = 'active'
    )
  )
  with check (
    owner_id = auth.uid()
    or id in (
      select wm.workspace_id from public.workspace_members wm
      where wm.user_id = auth.uid() and wm.status = 'active'
    )
  );

-- workspace_members: read members in my workspace; write limited to owners (or self-join on own workspace creation)
alter table public.workspace_members enable row level security;
drop policy if exists workspace_members_read on public.workspace_members;
create policy workspace_members_read on public.workspace_members
  for select
  to authenticated
  using (
    workspace_id in (
      select wm.workspace_id from public.workspace_members wm
      where wm.user_id = auth.uid() and wm.status = 'active'
    )
  );

drop policy if exists workspace_members_write_owner on public.workspace_members;
create policy workspace_members_write_owner on public.workspace_members
  for insert, update, delete
  to authenticated
  using (
    workspace_id in (
      select w.id from public.workspaces w where w.owner_id = auth.uid()
    )
  )
  with check (
    workspace_id in (
      select w.id from public.workspaces w where w.owner_id = auth.uid()
    )
  );

-- tasks
alter table public.tasks enable row level security;
drop policy if exists tasks_workspace_member on public.tasks;
create policy tasks_workspace_member on public.tasks
  for all
  to authenticated
  using (
    workspace_id in (
      select wm.workspace_id from public.workspace_members wm
      where wm.user_id = auth.uid() and wm.status = 'active'
    )
  )
  with check (
    workspace_id in (
      select wm.workspace_id from public.workspace_members wm
      where wm.user_id = auth.uid() and wm.status = 'active'
    )
  );

-- documents
alter table public.documents enable row level security;
drop policy if exists documents_workspace_member on public.documents;
create policy documents_workspace_member on public.documents
  for all
  to authenticated
  using (
    workspace_id in (
      select wm.workspace_id from public.workspace_members wm
      where wm.user_id = auth.uid() and wm.status = 'active'
    )
  )
  with check (
    workspace_id in (
      select wm.workspace_id from public.workspace_members wm
      where wm.user_id = auth.uid() and wm.status = 'active'
    )
  );

-- events (previously permissive MVP)
alter table public.events enable row level security;
drop policy if exists events_workspace_member on public.events;
create policy events_workspace_member on public.events
  for all
  to authenticated
  using (
    workspace_id in (
      select wm.workspace_id from public.workspace_members wm
      where wm.user_id = auth.uid() and wm.status = 'active'
    )
  )
  with check (
    workspace_id in (
      select wm.workspace_id from public.workspace_members wm
      where wm.user_id = auth.uid() and wm.status = 'active'
    )
  );

-- user_workspace_states: must be per-user
alter table public.user_workspace_states enable row level security;
drop policy if exists user_workspace_states_own on public.user_workspace_states;
create policy user_workspace_states_own on public.user_workspace_states
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Agent tables (OpsAgent / Onboarding) — protect conversations/messages
-- ---------------------------------------------------------------------------
alter table public.agent_conversations enable row level security;
alter table public.agent_messages enable row level security;

drop policy if exists agent_conversations_own on public.agent_conversations;
create policy agent_conversations_own on public.agent_conversations
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists agent_messages_by_conversation_owner on public.agent_messages;
create policy agent_messages_by_conversation_owner on public.agent_messages
  for all
  to authenticated
  using (
    conversation_id in (
      select c.id from public.agent_conversations c
      where c.user_id = auth.uid()
    )
  )
  with check (
    conversation_id in (
      select c.id from public.agent_conversations c
      where c.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Storage note:
-- Storage bucket policies live in `opsbrain/supabase/storage_policies_documents.sql`.
-- Ensure bucket `documents` exists (private) and that policies were applied.
-- ---------------------------------------------------------------------------

