-- 0010_client_errors.sql - sink for client-side runtime errors
--
-- The ErrorBoundary, window 'error', and unhandled rejection handlers in
-- src/lib/errorReporting.ts forward reports here when running in production.
-- The table is append-only from the client; only admins can read it.

create table if not exists public.client_errors (
  id              uuid primary key default gen_random_uuid(),
  source          text not null check (source in ('error-boundary', 'window-error', 'unhandled-rejection')),
  message         text not null,
  stack           text,
  component_stack text,
  route           text,
  user_agent      text,
  app_version     text,
  actor_id        uuid references public.profiles(id) on delete set null,
  actor_email     text,
  reported_at     timestamptz not null default now()
);

comment on table public.client_errors is
  'Runtime errors reported from the React app. Append-only from clients.';

create index if not exists client_errors_reported_at_idx
  on public.client_errors (reported_at desc);

create index if not exists client_errors_source_idx
  on public.client_errors (source, reported_at desc);

alter table public.client_errors enable row level security;

-- Read: admins only.
drop policy if exists "client_errors_read_admin" on public.client_errors;
create policy "client_errors_read_admin"
  on public.client_errors for select
  to authenticated
  using (public.is_admin());

-- Insert: any authenticated user can log their own error. We also let
-- anonymous clients log errors so an auth failure or login-page crash can
-- still be captured.
drop policy if exists "client_errors_insert_authenticated" on public.client_errors;
create policy "client_errors_insert_authenticated"
  on public.client_errors for insert
  to authenticated
  with check (
    actor_id is null
    or actor_id = auth.uid()
  );

drop policy if exists "client_errors_insert_anon" on public.client_errors;
create policy "client_errors_insert_anon"
  on public.client_errors for insert
  to anon
  with check (actor_id is null);

-- No update / delete policies: rows are immutable from the client.
