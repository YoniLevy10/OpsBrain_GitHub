-- OpsBrain v3: contacts + finance_records (Dashboard / KPI), RLS, Realtime publication
-- Run after 20260419000000_init_opsbrain.sql and 20260420000000_reference_doc_schema.sql

-- ---------------------------------------------------------------------------
-- contacts (CRM — שם טבלה כמו במסמך המשימות)
-- ---------------------------------------------------------------------------
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  type text default 'client',
  name text not null default '',
  email text,
  phone text,
  company text,
  notes text,
  tags text[] default '{}',
  data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contacts_workspace on public.contacts (workspace_id);

-- ---------------------------------------------------------------------------
-- finance_records (הכנסות/הוצאות — עמודות מפורשות)
-- ---------------------------------------------------------------------------
create table if not exists public.finance_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric(12, 2) not null default 0,
  currency text default 'ILS',
  description text,
  contact_id uuid references public.contacts (id) on delete set null,
  document_id uuid references public.documents (id) on delete set null,
  date date default current_date,
  data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_finance_records_workspace on public.finance_records (workspace_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.contacts enable row level security;
alter table public.finance_records enable row level security;

drop policy if exists "contacts_workspace_member" on public.contacts;
create policy "contacts_workspace_member" on public.contacts
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

drop policy if exists "finance_records_workspace_member" on public.finance_records;
create policy "finance_records_workspace_member" on public.finance_records
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

-- ---------------------------------------------------------------------------
-- Realtime (בטוח אם כבר רשום — בודקים דרך pg_catalog)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    execute 'alter publication supabase_realtime add table public.messages';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    execute 'alter publication supabase_realtime add table public.notifications';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ai_insights'
  ) then
    execute 'alter publication supabase_realtime add table public.ai_insights';
  end if;
exception
  when undefined_object then
    raise notice 'supabase_realtime publication missing — enable Realtime in Dashboard';
  when duplicate_object then
    null;
end $$;
