-- 0005_remove_awarded_status.sql - collapse Awarded into Completed

drop policy if exists "events_update_own_pending" on public.sourcing_events;
drop policy if exists "events_delete_own_pending" on public.sourcing_events;

alter table public.sourcing_events
  alter column status drop default;

do $$
begin
  if exists (
    select 1
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'event_status'
      and e.enumlabel = 'Awarded'
  ) then
    alter type public.event_status rename to event_status_old;
    create type public.event_status as enum ('Planned', 'Live', 'Completed');

    alter table public.sourcing_events
      alter column status type public.event_status
      using (
        case
          when status::text = 'Awarded' then 'Completed'
          else status::text
        end
      )::public.event_status;

    drop type public.event_status_old;
  end if;
end $$;

alter table public.sourcing_events
  alter column status set default 'Planned'::public.event_status;

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
