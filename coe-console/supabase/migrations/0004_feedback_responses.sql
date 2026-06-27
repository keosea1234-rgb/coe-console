-- ============================================================================
-- 0004_feedback_responses.sql - NPS feedback responses
--
-- Stores requestor NPS results for feedback requests.
-- Run this AFTER 0003_event_id_text.sql.
-- ============================================================================

create table if not exists public.feedback_responses (
  id              uuid primary key default gen_random_uuid(),
  event_id        text not null references public.sourcing_events(id) on delete cascade,
  requestor_id    uuid not null references public.profiles(id) on delete cascade,
  requestor_email text not null,
  tool_score      integer not null check (tool_score between 0 and 10),
  support_score   integer not null check (support_score between 0 and 10),
  comment         text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (event_id, requestor_id)
);

comment on table public.feedback_responses is
  'NPS feedback submitted by event requestors after an admin asks for feedback.';

create index if not exists feedback_responses_event_id_idx
  on public.feedback_responses (event_id);

create trigger feedback_responses_touch_updated_at
  before update on public.feedback_responses
  for each row execute function public.touch_updated_at();

alter table public.feedback_responses enable row level security;

create policy "feedback_read_admin_or_own"
  on public.feedback_responses for select
  to authenticated
  using (
    public.is_admin()
    or requestor_id = auth.uid()
  );

create policy "feedback_insert_own_request"
  on public.feedback_responses for insert
  to authenticated
  with check (
    requestor_id = auth.uid()
    and exists (
      select 1
      from public.sourcing_events e
      where e.id = event_id
        and e.requestor_id = auth.uid()
        and e.feedback_requested = true
    )
  );

create policy "feedback_update_own_request"
  on public.feedback_responses for update
  to authenticated
  using (requestor_id = auth.uid())
  with check (
    requestor_id = auth.uid()
    and exists (
      select 1
      from public.sourcing_events e
      where e.id = event_id
        and e.requestor_id = auth.uid()
        and e.feedback_requested = true
    )
  );
