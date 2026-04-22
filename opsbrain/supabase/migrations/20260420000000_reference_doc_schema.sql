-- OpsBrain Developer Reference v1.0 — typed columns + chat + profiles + ai_insights
-- Safe to run after 20260419000000_init_opsbrain.sql

-- ---------------------------------------------------------------------------
-- profiles (extends auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_full_name on public.profiles using gin (to_tsvector('simple', coalesce(full_name, '')));

-- ---------------------------------------------------------------------------
-- workspaces: add reference-doc columns (keep data jsonb for legacy rows)
-- ---------------------------------------------------------------------------
alter table public.workspaces
  add column if not exists name text,
  add column if not exists owner_id uuid references auth.users (id) on delete set null,
  add column if not exists slug text,
  add column if not exists plan text default 'free',
  add column if not exists settings jsonb not null default '{}'::jsonb;

create unique index if not exists idx_workspaces_slug_unique on public.workspaces (slug) where slug is not null;

-- ---------------------------------------------------------------------------
-- workspace_members: first-class user_id / role (keep data jsonb)
-- ---------------------------------------------------------------------------
alter table public.workspace_members
  add column if not exists user_id uuid references auth.users (id) on delete cascade,
  add column if not exists role text default 'member',
  add column if not exists joined_at timestamptz default now();

create index if not exists idx_workspace_members_user on public.workspace_members (user_id);

-- Backfill from legacy jsonb only if the `data` column exists.
-- Some projects created `workspace_members` without a `data` jsonb column.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'workspace_members'
      and column_name = 'data'
  ) then
    execute $sql$
      update public.workspace_members wm
      set
        user_id = coalesce(wm.user_id, (wm.data->>'user_id')::uuid),
        role = coalesce(wm.role, nullif(wm.data->>'role', ''), 'member'),
        joined_at = coalesce(wm.joined_at, (wm.data->>'joined_at')::timestamptz, wm.created_at)
      where wm.user_id is null and wm.data ? 'user_id'
    $sql$;
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- tasks: typed columns per reference doc (keep data jsonb)
-- ---------------------------------------------------------------------------
alter table public.tasks
  add column if not exists title text,
  add column if not exists status text,
  add column if not exists priority text,
  add column if not exists assigned_to uuid references auth.users (id) on delete set null,
  add column if not exists due_date date,
  add column if not exists module_ref text,
  add column if not exists module_ref_id uuid;

-- Backfill from legacy jsonb only if the `data` column exists.
-- Some projects created `tasks` without a `data` jsonb column.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tasks'
      and column_name = 'data'
  ) then
    execute $sql$
      update public.tasks t
      set
        title = coalesce(t.title, t.data->>'title'),
        status = coalesce(t.status, t.data->>'status'),
        priority = coalesce(t.priority, t.data->>'priority'),
        assigned_to = coalesce(t.assigned_to, (t.data->>'assigned_to')::uuid),
        due_date = coalesce(t.due_date, (t.data->>'due_date')::date),
        module_ref = coalesce(t.module_ref, t.data->>'module_ref'),
        module_ref_id = coalesce(t.module_ref_id, (t.data->>'module_ref_id')::uuid)
      where t.title is null and t.data is not null
    $sql$;
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Team chat (Chat.jsx)
-- ---------------------------------------------------------------------------
create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_channels_workspace on public.channels (workspace_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  content text,
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_channel on public.messages (channel_id);
create index if not exists idx_messages_workspace on public.messages (workspace_id);

-- ---------------------------------------------------------------------------
-- AI Agent memory (AIAgent.jsx uses ai_insights)
-- ---------------------------------------------------------------------------
create table if not exists public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  type text,
  content text,
  source_module text,
  severity text,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  data jsonb not null default '{}'::jsonb
);

create index if not exists idx_ai_insights_workspace on public.ai_insights (workspace_id);

-- ---------------------------------------------------------------------------
-- Auth: auto-create profile on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.channels enable row level security;
alter table public.messages enable row level security;
alter table public.ai_insights enable row level security;

drop policy if exists "profiles_rw_own" on public.profiles;
create policy "profiles_rw_own" on public.profiles
  for all to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "channels_workspace" on public.channels;
create policy "channels_workspace" on public.channels
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

drop policy if exists "messages_workspace" on public.messages;
create policy "messages_workspace" on public.messages
  for all to authenticated
  using (
    coalesce(workspace_id, (
      select c.workspace_id from public.channels c where c.id = messages.channel_id
    )) in (
      select wm.workspace_id from public.workspace_members wm
      where wm.user_id = auth.uid()
    )
  )
  with check (
    coalesce(workspace_id, (
      select c.workspace_id from public.channels c where c.id = messages.channel_id
    )) in (
      select wm.workspace_id from public.workspace_members wm
      where wm.user_id = auth.uid()
    )
  );

drop policy if exists "ai_insights_workspace" on public.ai_insights;
create policy "ai_insights_workspace" on public.ai_insights
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

