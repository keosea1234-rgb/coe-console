-- 0006_feedback_for_unassigned_events.sql - allow feedback on unassigned events

drop policy if exists "feedback_insert_own_request" on public.feedback_responses;
drop policy if exists "feedback_update_own_request" on public.feedback_responses;

create policy "feedback_insert_own_request"
  on public.feedback_responses for insert
  to authenticated
  with check (
    requestor_id = auth.uid()
    and exists (
      select 1
      from public.sourcing_events e
      where e.id = event_id
        and e.feedback_requested = true
        and (
          e.requestor_id = auth.uid()
          or (e.requestor_id is null and e.requestor is null)
        )
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
        and e.feedback_requested = true
        and (
          e.requestor_id = auth.uid()
          or (e.requestor_id is null and e.requestor is null)
        )
    )
  );
