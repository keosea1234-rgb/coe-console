-- 0009_event_attachments.sql - file attachments for sourcing events
--
-- Until this migration the request form only kept the picked File in memory and
-- dropped it on submit. This adds:
--   1. A `request-attachments` private storage bucket.
--   2. Storage policies so users upload their own files; admins read everything.
--   3. A metadata table that links uploaded objects to a sourcing event.
--   4. RLS + audit trigger for the metadata table.
--
-- Run after 0008_request_archive.sql.

-- ---- Bucket ----------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'request-attachments',
  'request-attachments',
  false,
  10485760, -- 10 MB
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'image/png',
    'image/jpeg',
    'text/csv',
    'text/plain'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---- Storage object policies ----------------------------------------------
-- Owners (authenticated users) can upload into the bucket. Supabase Storage
-- stamps storage.objects.owner with auth.uid() on insert.
drop policy if exists "request_attachments_insert_own" on storage.objects;
create policy "request_attachments_insert_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'request-attachments');

-- Read: admins see everything; otherwise only the uploader.
drop policy if exists "request_attachments_read" on storage.objects;
create policy "request_attachments_read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'request-attachments'
    and (public.is_admin() or owner = auth.uid())
  );

-- Delete: admins or the uploader (mirrors read).
drop policy if exists "request_attachments_delete" on storage.objects;
create policy "request_attachments_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'request-attachments'
    and (public.is_admin() or owner = auth.uid())
  );

-- ---- Metadata table -------------------------------------------------------
create table if not exists public.event_attachments (
  id            uuid primary key default gen_random_uuid(),
  event_id      text not null references public.sourcing_events(id) on delete cascade,
  doc_type      text not null,
  file_name     text not null,
  storage_path  text not null unique,
  content_type  text,
  size_bytes    bigint not null check (size_bytes >= 0),
  uploaded_by   uuid references public.profiles(id) on delete set null,
  uploaded_at   timestamptz not null default now()
);

comment on table public.event_attachments is
  'Metadata for files uploaded against a sourcing event request. Binary lives in storage.';

create index if not exists event_attachments_event_id_idx
  on public.event_attachments (event_id, uploaded_at desc);

create index if not exists event_attachments_uploaded_by_idx
  on public.event_attachments (uploaded_by);

alter table public.event_attachments enable row level security;

-- Read: any authenticated user can list metadata for events they can see.
-- (sourcing_events is org-wide readable, so attachments follow the same model.)
drop policy if exists "event_attachments_read_authenticated" on public.event_attachments;
create policy "event_attachments_read_authenticated"
  on public.event_attachments for select
  to authenticated
  using (true);

-- Insert: the caller must stamp themselves as uploaded_by. Storage policy
-- gates the binary upload; this gates the metadata row.
drop policy if exists "event_attachments_insert_self" on public.event_attachments;
create policy "event_attachments_insert_self"
  on public.event_attachments for insert
  to authenticated
  with check (uploaded_by = auth.uid());

-- Delete: admins, or the uploader.
drop policy if exists "event_attachments_delete_admin_or_owner" on public.event_attachments;
create policy "event_attachments_delete_admin_or_owner"
  on public.event_attachments for delete
  to authenticated
  using (public.is_admin() or uploaded_by = auth.uid());

-- Audit trigger (matches the pattern in 0007).
drop trigger if exists event_attachments_audit_log on public.event_attachments;
create trigger event_attachments_audit_log
  after insert or update or delete on public.event_attachments
  for each row execute function public.write_audit_log();
