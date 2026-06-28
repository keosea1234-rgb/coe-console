-- 0011_audit_log_retention.sql - retention policy for the audit log
--
-- audit_log rows grow on every INSERT/UPDATE/DELETE against the audited
-- tables. Without housekeeping the table balloons; this migration adds:
--   1. A retention function that deletes rows older than N days (default 180).
--   2. An optional pg_cron schedule that runs the function daily at 03:00 UTC.
--
-- pg_cron is available on Supabase Pro/Team. On Free tier the CREATE EXTENSION
-- + cron.schedule calls will fail; in that case the function is still useful
-- to invoke manually from the SQL editor or from an external scheduler.

-- Retention is configurable per-call so it can also be invoked for one-off
-- cleanup with a different cutoff.
create or replace function public.prune_audit_log(retention_days integer default 180)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  cutoff timestamptz;
  removed integer;
begin
  if retention_days is null or retention_days < 30 then
    raise exception 'retention_days must be >= 30 (got %)', retention_days;
  end if;

  cutoff := now() - make_interval(days => retention_days);

  delete from public.audit_log
  where created_at < cutoff;

  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke all on function public.prune_audit_log(integer) from public;
grant execute on function public.prune_audit_log(integer) to service_role;

comment on function public.prune_audit_log(integer) is
  'Deletes audit_log rows older than retention_days. Intended for daily run via pg_cron or external scheduler.';

-- ---- Optional: pg_cron daily schedule -------------------------------------
-- Wrapped in a DO block so the migration succeeds even when pg_cron is not
-- available (e.g. Supabase Free tier). On Pro/Team the schedule is created
-- and runs every day at 03:00 UTC.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    -- Drop any prior schedule with the same name to keep the migration
    -- idempotent across re-runs.
    perform cron.unschedule(jobid)
    from cron.job
    where jobname = 'prune_audit_log_daily';

    perform cron.schedule(
      'prune_audit_log_daily',
      '0 3 * * *',
      $cron$select public.prune_audit_log(180);$cron$
    );
  else
    raise notice 'pg_cron not available; run select public.prune_audit_log(180); from an external scheduler.';
  end if;
exception
  when insufficient_privilege then
    raise notice 'Insufficient privilege to enable pg_cron; schedule must be created manually.';
end
$$;
