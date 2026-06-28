-- 0007_audit_log.sql - audit trail for security-sensitive data changes
--
-- Captures inserts, updates, and deletes for the operational tables that drive
-- executive reporting. The audit table is append-only through trigger code:
-- authenticated clients can read it only when they are admins, and cannot write
-- to it directly through the API.

create table if not exists public.audit_log (
  id             uuid primary key default gen_random_uuid(),
  table_name     text not null,
  operation      text not null check (operation in ('INSERT', 'UPDATE', 'DELETE')),
  record_id      text not null,
  actor_id       uuid references public.profiles(id) on delete set null,
  actor_email    text,
  changed_fields text[] not null default '{}',
  old_data       jsonb,
  new_data       jsonb,
  created_at     timestamptz not null default now()
);

comment on table public.audit_log is
  'Append-only audit trail for sourcing events, spend baseline, and feedback responses.';

create index if not exists audit_log_table_record_idx
  on public.audit_log (table_name, record_id, created_at desc);

create index if not exists audit_log_actor_idx
  on public.audit_log (actor_id, created_at desc);

create index if not exists audit_log_created_at_idx
  on public.audit_log (created_at desc);

alter table public.audit_log enable row level security;

drop policy if exists "audit_log_read_admin" on public.audit_log;
create policy "audit_log_read_admin"
  on public.audit_log for select
  to authenticated
  using (public.is_admin());

-- No insert/update/delete policies: app clients cannot write or mutate audit rows.

create or replace function public.audit_changed_fields(old_row jsonb, new_row jsonb)
returns text[]
language sql
stable
set search_path = public
as $audit_changed_fields$
  select coalesce(array_agg(key order by key), '{}')
  from (
    select coalesce(o.key, n.key) as key
    from jsonb_each(old_row) as o(key, value)
    full join jsonb_each(new_row) as n(key, value)
      on o.key = n.key
    where o.value is distinct from n.value
  ) changed;
$audit_changed_fields$;

create or replace function public.audit_record_id(row_data jsonb)
returns text
language sql
stable
set search_path = public
as $audit_record_id$
  select case
    when row_data ? 'id' then row_data ->> 'id'
    when row_data ? 'event_id' then row_data ->> 'event_id'
    when row_data ? 'fy' then concat_ws(':', row_data ->> 'fy', row_data ->> 'category', row_data ->> 'region')
    else md5(row_data::text)
  end;
$audit_record_id$;

create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $write_audit_log$
declare
  old_json jsonb;
  new_json jsonb;
  actor uuid;
  actor_profile_email text;
begin
  old_json := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
  new_json := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;
  actor := auth.uid();

  select p.email
  into actor_profile_email
  from public.profiles p
  where p.id = actor;

  insert into public.audit_log (
    table_name,
    operation,
    record_id,
    actor_id,
    actor_email,
    changed_fields,
    old_data,
    new_data
  )
  values (
    tg_table_name,
    tg_op,
    public.audit_record_id(coalesce(new_json, old_json)),
    actor,
    actor_profile_email,
    case
      when tg_op = 'UPDATE' then public.audit_changed_fields(old_json, new_json)
      when tg_op = 'INSERT' then public.audit_changed_fields('{}'::jsonb, new_json)
      else public.audit_changed_fields(old_json, '{}'::jsonb)
    end,
    old_json,
    new_json
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$write_audit_log$;

drop trigger if exists sourcing_events_audit_log on public.sourcing_events;
create trigger sourcing_events_audit_log
  after insert or update or delete on public.sourcing_events
  for each row execute function public.write_audit_log();

drop trigger if exists spend_baseline_audit_log on public.spend_baseline;
create trigger spend_baseline_audit_log
  after insert or update or delete on public.spend_baseline
  for each row execute function public.write_audit_log();

drop trigger if exists feedback_responses_audit_log on public.feedback_responses;
create trigger feedback_responses_audit_log
  after insert or update or delete on public.feedback_responses
  for each row execute function public.write_audit_log();
