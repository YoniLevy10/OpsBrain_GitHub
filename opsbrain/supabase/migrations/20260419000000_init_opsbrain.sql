-- OPSBRAIN: core tables (entity rows use jsonb `data` + optional workspace_id)
-- Run via Supabase CLI or SQL Editor after linking the project.

create extension if not exists pgcrypto;

-- Root workspace records (no workspace_id)
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'
);
create index if not exists idx_reports_workspace on public.reports (workspace_id);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'
);
create index if not exists idx_projects_workspace on public.projects (workspace_id);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'
);
create index if not exists idx_clients_workspace on public.clients (workspace_id);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'
);
create index if not exists idx_tasks_workspace on public.tasks (workspace_id);

create table if not exists public.user_workspace_states (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'
);
create index if not exists idx_user_workspace_states_ws on public.user_workspace_states (workspace_id);

create table if not exists public.professionals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'
);
create index if not exists idx_professionals_workspace on public.professionals (workspace_id);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'
);
create index if not exists idx_invoices_workspace on public.invoices (workspace_id);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'
);
create index if not exists idx_businesses_workspace on public.businesses (workspace_id);

create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'
);
create index if not exists idx_integrations_workspace on public.integrations (workspace_id);

create table if not exists public.sync_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'
);
create index if not exists idx_sync_logs_workspace on public.sync_logs (workspace_id);

create table if not exists public.dashboard_widgets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'
);
create index if not exists idx_dashboard_widgets_workspace on public.dashboard_widgets (workspace_id);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'
);
create index if not exists idx_workspace_members_workspace on public.workspace_members (workspace_id);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'
);
create index if not exists idx_permissions_workspace on public.permissions (workspace_id);

create table if not exists public.forecasts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'
);
create index if not exists idx_forecasts_workspace on public.forecasts (workspace_id);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'
);
create index if not exists idx_transactions_workspace on public.transactions (workspace_id);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'
);
create index if not exists idx_subscriptions_workspace on public.subscriptions (workspace_id);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'
);
create index if not exists idx_payments_workspace on public.payments (workspace_id);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'
);
create index if not exists idx_reviews_workspace on public.reviews (workspace_id);

create table if not exists public.professional_chats (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'
);
create index if not exists idx_professional_chats_workspace on public.professional_chats (workspace_id);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'
);
create index if not exists idx_chat_messages_workspace on public.chat_messages (workspace_id);

create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'
);
create index if not exists idx_time_entries_workspace on public.time_entries (workspace_id);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'
);
create index if not exists idx_budgets_workspace on public.budgets (workspace_id);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'
);
create index if not exists idx_documents_workspace on public.documents (workspace_id);

create table if not exists public.workspace_integrations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'
);
create index if not exists idx_workspace_integrations_workspace on public.workspace_integrations (workspace_id);

create table if not exists public.dashboard_configs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'
);
create index if not exists idx_dashboard_configs_workspace on public.dashboard_configs (workspace_id);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'
);
create index if not exists idx_notifications_workspace on public.notifications (workspace_id);

create table if not exists public.activity_feeds (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'
);
create index if not exists idx_activity_feeds_workspace on public.activity_feeds (workspace_id);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'
);
create index if not exists idx_comments_workspace on public.comments (workspace_id);

create table if not exists public.interactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'
);
create index if not exists idx_interactions_workspace on public.interactions (workspace_id);

create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'
);
create index if not exists idx_automations_workspace on public.automations (workspace_id);

create table if not exists public.document_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'
);
create index if not exists idx_document_templates_workspace on public.document_templates (workspace_id);

create table if not exists public.analytics (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'
);
create index if not exists idx_analytics_workspace on public.analytics (workspace_id);

create table if not exists public.ml_insights (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'
);
create index if not exists idx_ml_insights_workspace on public.ml_insights (workspace_id);

-- Agent chat (Financial Assistant, onboarding)
create table if not exists public.agent_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  agent_name text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_agent_conversations_user on public.agent_conversations (user_id);

create table if not exists public.agent_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.agent_conversations (id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_agent_messages_conversation on public.agent_messages (conversation_id);

-- Lightweight client-side navigation logging
create table if not exists public.app_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  page text,
  created_at timestamptz not null default now()
);
create index if not exists idx_app_logs_user on public.app_logs (user_id);

-- RLS: tighten these per product rules; this allows any signed-in user to read/write (dev-friendly).
alter table public.workspaces enable row level security;
alter table public.reports enable row level security;
alter table public.projects enable row level security;
alter table public.clients enable row level security;
alter table public.tasks enable row level security;
alter table public.user_workspace_states enable row level security;
alter table public.professionals enable row level security;
alter table public.invoices enable row level security;
alter table public.businesses enable row level security;
alter table public.integrations enable row level security;
alter table public.sync_logs enable row level security;
alter table public.dashboard_widgets enable row level security;
alter table public.workspace_members enable row level security;
alter table public.permissions enable row level security;
alter table public.forecasts enable row level security;
alter table public.transactions enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
alter table public.professional_chats enable row level security;
alter table public.chat_messages enable row level security;
alter table public.time_entries enable row level security;
alter table public.budgets enable row level security;
alter table public.documents enable row level security;
alter table public.workspace_integrations enable row level security;
alter table public.dashboard_configs enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_feeds enable row level security;
alter table public.comments enable row level security;
alter table public.interactions enable row level security;
alter table public.automations enable row level security;
alter table public.document_templates enable row level security;
alter table public.analytics enable row level security;
alter table public.ml_insights enable row level security;
alter table public.agent_conversations enable row level security;
alter table public.agent_messages enable row level security;
alter table public.app_logs enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'workspaces','reports','projects','clients','tasks','user_workspace_states','professionals',
    'invoices','businesses','integrations','sync_logs','dashboard_widgets','workspace_members',
    'permissions','forecasts','transactions','subscriptions','payments','reviews','professional_chats',
    'chat_messages','time_entries','budgets','documents','workspace_integrations','dashboard_configs',
    'notifications','activity_feeds','comments','interactions','automations','document_templates',
    'analytics','ml_insights',
    'agent_conversations','agent_messages','app_logs'
  ]
  loop
    execute format(
      'drop policy if exists %I on public.%I',
      'authenticated_rw_' || t, t
    );
    execute format(
      'create policy %I on public.%I for all to authenticated using (true) with check (true)',
      'authenticated_rw_' || t, t
    );
  end loop;
end $$;

-- Enable Realtime for agent_messages in Supabase Dashboard → Database → Replication, if needed.
