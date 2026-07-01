-- 0013_rls_attachment_hardening.sql - tighten profile/event/attachment reads
--
-- This keeps the current single-org model but removes broad authenticated reads
-- for user profiles, event metadata, and attachment metadata.

-- ---- profiles --------------------------------------------------------------
drop policy if exists "profiles_read_authenticated" on public.profiles;
create policy "profiles_read_authenticated"
  on public.profiles for select
  to authenticated
  using (
    id = auth.uid()
    or public.is_admin()
  );

-- ---- sourcing_events -------------------------------------------------------
-- Admins retain the shared operational view. Regular users can read only rows
-- tied to their profile through requestor_id; a future tenant model can broaden
-- this through explicit organization membership rather than using (true).
drop policy if exists "events_read_authenticated" on public.sourcing_events;
create policy "events_read_authenticated"
  on public.sourcing_events for select
  to authenticated
  using (
    public.is_admin()
    or requestor_id = auth.uid()
  );

-- ---- Storage object policies ----------------------------------------------
-- Storage objects do not have a first-class event_id column, so event access is
-- enforced through event_attachments.storage_path. Uploads remain bucket-scoped;
-- the metadata insert policy below is the authoritative event-access check.
drop policy if exists "request_attachments_read" on storage.objects;
create policy "request_attachments_read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'request-attachments'
    and (
      public.is_admin()
      or owner = auth.uid()
      or exists (
        select 1
        from public.event_attachments a
        join public.sourcing_events e on e.id = a.event_id
        where a.storage_path = storage.objects.name
          and (
            a.uploaded_by = auth.uid()
            or e.requestor_id = auth.uid()
          )
      )
    )
  );

-- ---- Attachment metadata ---------------------------------------------------
drop policy if exists "event_attachments_read_authenticated" on public.event_attachments;
create policy "event_attachments_read_authenticated"
  on public.event_attachments for select
  to authenticated
  using (
    public.is_admin()
    or uploaded_by = auth.uid()
    or exists (
      select 1
      from public.sourcing_events e
      where e.id = event_id
        and e.requestor_id = auth.uid()
    )
  );

drop policy if exists "event_attachments_insert_self" on public.event_attachments;
create policy "event_attachments_insert_self"
  on public.event_attachments for insert
  to authenticated
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1
      from storage.objects o
      where o.bucket_id = 'request-attachments'
        and o.name = storage_path
        and o.owner = auth.uid()
    )
    and exists (
      select 1
      from public.sourcing_events e
      where e.id = event_id
        and (
          public.is_admin()
          or (
            e.requestor_id = auth.uid()
            and e.request_created_at is not null
          )
        )
    )
  );
