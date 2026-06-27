-- ============================================================================
-- 0002_rls.sql — Row-Level Security for the CoE Console
--
-- Policy summary:
--   profiles         every authenticated user can read all profiles;
--                    nobody writes through the API (managed by trigger +
--                    manual SQL by an admin)
--   sourcing_events  every authenticated user can read all events;
--                    users can INSERT only with requestor_id = auth.uid();
--                    users can UPDATE/DELETE only their own request-events
--                    (rows with request_created_at not null) AND only while
--                    status is still 'Planned';
--                    admins can UPDATE/DELETE anything
--   spend_baseline   every authenticated user can read;
--                    only admins can write
--
-- Run this AFTER 0001_schema.sql.
-- ============================================================================

-- ---- Helper: is the current caller an admin? -------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---- Enable RLS ------------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.sourcing_events enable row level security;
alter table public.spend_baseline  enable row level security;

-- ---- profiles --------------------------------------------------------------
create policy "profiles_read_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

-- (No insert/update/delete policies → blocked by RLS for normal users.
--  The on_auth_user_created trigger runs as SECURITY DEFINER so it bypasses
--  RLS for the initial insert; admins manage roles via the SQL editor.)

-- ---- sourcing_events -------------------------------------------------------
-- Read: anyone signed in can see the full org-wide event list (the Console
-- is a shared executive view).
create policy "events_read_authenticated"
  on public.sourcing_events for select
  to authenticated
  using (true);

-- Insert: the caller must stamp themselves as requestor_id, and the row
-- must be a user-submitted request (request_created_at is set). Admins
-- can also insert seeded rows without those constraints.
create policy "events_insert_self_request"
  on public.sourcing_events for insert
  to authenticated
  with check (
    public.is_admin()
    or (requestor_id = auth.uid() and request_created_at is not null)
  );

-- Update: admins can update anything; users can update their own request
-- rows only while they are still in 'Planned' status, and may not change
-- ownership.
create policy "events_update_admin"
  on public.sourcing_events for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "events_update_own_pending"
  on public.sourcing_events for update
  to authenticated
  using (
    requestor_id = auth.uid()
    and request_created_at is not null
    and status = 'Planned'
  )
  with check (
    requestor_id = auth.uid()
    and request_created_at is not null
    and status = 'Planned'
  );

-- Delete: admins can delete anything; users can delete their own pending
-- request rows.
create policy "events_delete_admin"
  on public.sourcing_events for delete
  to authenticated
  using (public.is_admin());

create policy "events_delete_own_pending"
  on public.sourcing_events for delete
  to authenticated
  using (
    requestor_id = auth.uid()
    and request_created_at is not null
    and status = 'Planned'
  );

-- ---- spend_baseline --------------------------------------------------------
create policy "baseline_read_authenticated"
  on public.spend_baseline for select
  to authenticated
  using (true);

create policy "baseline_write_admin"
  on public.spend_baseline for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
