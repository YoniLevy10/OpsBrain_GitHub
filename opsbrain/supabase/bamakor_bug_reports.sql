-- Bamakor (separate Supabase project) — bug reports table + RLS
-- Run this in the Bamakor Supabase SQL editor (not the main OpsBrain project).

create extension if not exists pgcrypto;

create table if not exists public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  severity text not null default 'medium',
  screenshot_path text,
  created_at timestamptz not null default now()
);

alter table public.bug_reports enable row level security;

-- Allow authenticated users (anon key + logged-in user JWT) to insert/read their own rows.
-- Adjust policies if you want public inserts from the OpsBrain app without auth.

drop policy if exists "bug_reports_insert_authenticated" on public.bug_reports;
create policy "bug_reports_insert_authenticated" on public.bug_reports
  for insert to authenticated
  with check (true);

drop policy if exists "bug_reports_select_authenticated" on public.bug_reports;
create policy "bug_reports_select_authenticated" on public.bug_reports
  for select to authenticated
  using (true);
