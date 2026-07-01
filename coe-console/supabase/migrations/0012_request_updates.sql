-- 0012_request_updates.sql - in-app request conversation updates
--
-- Adds persistent, app-native updates for user-submitted requests. Admins can
-- participate on any request; requestors can participate only on their own
-- request events.

create table if not exists public.request_updates (
  id            uuid primary key default gen_random_uuid(),
  event_id      text not null references public.sourcing_events(id) on delete cascade,
  author_id     uuid not null references public.profiles(id) on delete cascade,
  author_email  text not null,
  author_role   user_role not null,
  body          text not null check (length(trim(body)) > 0 and length(body) <= 2000),
  created_at    timestamptz not null default now()
);

comment on table public.request_updates is
  'App-native conversation updates attached to user-submitted sourcing requests.';

create index if not exists request_updates_event_id_idx
  on public.request_updates (event_id, created_at);

create index if not exists request_updates_author_id_idx
  on public.request_updates (author_id);

alter table public.request_updates enable row level security;

drop policy if exists "request_updates_read_participants" on public.request_updates;
create policy "request_updates_read_participants"
  on public.request_updates for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.sourcing_events e
      where e.id = event_id
        and e.request_created_at is not null
        and e.requestor_id = auth.uid()
    )
  );

drop policy if exists "request_updates_insert_participants" on public.request_updates;
create policy "request_updates_insert_participants"
  on public.request_updates for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and author_email = (
      select p.email
      from public.profiles p
      where p.id = auth.uid()
    )
    and (
      (
        public.is_admin()
        and author_role = 'admin'
        and exists (
          select 1
          from public.sourcing_events e
          where e.id = event_id
            and e.request_created_at is not null
        )
      )
      or (
        author_role = 'user'
        and exists (
          select 1
          from public.sourcing_events e
          where e.id = event_id
            and e.request_created_at is not null
            and e.requestor_id = auth.uid()
        )
      )
    )
  );

drop trigger if exists request_updates_audit_log on public.request_updates;
create trigger request_updates_audit_log
  after insert or update or delete on public.request_updates
  for each row execute function public.write_audit_log();
