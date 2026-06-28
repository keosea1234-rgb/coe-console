-- 0008_request_archive.sql - archive workflow for user-submitted requests
--
-- Keeps request records available for audit/reporting while letting admins hide
-- completed or irrelevant requests from the active inbox.

alter table public.sourcing_events
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.profiles(id) on delete set null;

create index if not exists sourcing_events_archived_at_idx
  on public.sourcing_events (archived_at);
