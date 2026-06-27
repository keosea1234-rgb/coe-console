-- 0005_remove_awarded_status.sql - collapse Awarded into Completed

update public.sourcing_events
set status = 'Completed'
where status = 'Awarded';

drop policy if exists "events_update_own_pending" on public.sourcing_events;
drop policy if exists "events_delete_own_pending" on public.sourcing_events;

alter type event_status rename to event_status_old;
create type event_status as enum ('Planned', 'Live', 'Completed');

alter table public.sourcing_events
  alter column status drop default,
  alter column status type event_status using status::text::event_status,
  alter column status set default 'Planned';

drop type event_status_old;

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

create policy "events_delete_own_pending"
  on public.sourcing_events for delete
  to authenticated
  using (
    requestor_id = auth.uid()
    and request_created_at is not null
    and status = 'Planned'
  );
