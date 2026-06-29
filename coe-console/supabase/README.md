# Supabase setup

Step-by-step for wiring the eSourcing CoE Console to a fresh Supabase project.

## 1. Create the project

1. Sign in at <https://supabase.com> -> **New project**.
2. Pick a region close to the users (Frankfurt = `eu-central-1` is a good default for Amcor).
3. Save the database password in a password manager.

## 2. Run the migrations

Open **SQL Editor -> New query** in the Supabase dashboard and run the files in this folder **in order**:

1. `migrations/0001_schema.sql` - extensions, enums, tables, indices, signup trigger.
2. `migrations/0002_rls.sql` - row-level security policies.
3. `migrations/0003_event_id_text.sql` - event id type alignment.
4. `migrations/0004_feedback_responses.sql` - NPS feedback response storage and RLS.
5. `migrations/0005_remove_awarded_status.sql` - collapses Awarded events into Completed and removes the enum label.
6. `migrations/0006_feedback_for_unassigned_events.sql` - allows feedback submissions for admin-requested events without a stored requestor.
7. `migrations/0007_audit_log.sql` - append-only audit trail for event, baseline, and feedback changes.
8. `migrations/0008_request_archive.sql` - admin archive workflow for user-submitted requests.
9. `migrations/0009_event_attachments.sql` - storage bucket + metadata table for request attachments.
10. `migrations/0010_client_errors.sql` - sink table for client runtime error reports (admins read; clients append-only).
11. `migrations/0011_audit_log_retention.sql` - prune function + optional pg_cron daily schedule for `audit_log` retention.

For each file: paste the contents -> **Run**. You should see a "Success. No rows returned." message. If a statement fails partway through, fix the cause and re-run the whole file.

## 3. Grab your API credentials

In the dashboard: **Settings -> API**.

- `Project URL` -> the value of `VITE_SUPABASE_URL`
- `anon public` key -> the value of `VITE_SUPABASE_ANON_KEY`

Paste these into `coe-console/.env.local` (see `.env.example`). Never commit `.env.local`, and **never** share the `service_role` key - it bypasses RLS.

## 4. Create users + promote an admin

Production access is admin-created or invite-only. Keep public signup disabled
unless a non-production environment deliberately sets
`VITE_AUTH_SIGNUP_ENABLED=true`.

1. In the dashboard: **Authentication -> Users -> Add user**. Create at least one user that will become the CoE admin.
2. Run this in SQL Editor to promote them:

   ```sql
   update public.profiles
   set    role = 'admin'
   where  email = 'admin@amcor.com';   -- replace with the real email
   ```

3. Verify:

   ```sql
   select id, email, role from public.profiles order by created_at desc;
   ```

## 5. Seed demo data

The seed script uses the Supabase `service_role` key so it can bypass RLS for
idempotent demo-data loading. In the dashboard, go to **Settings -> API** and
copy the `service_role` key. Never commit this key and never share it; it
bypasses row-level security.

Add these Node env vars to `coe-console/.env.local`:

```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The seed script reads Node env vars, not Vite's `VITE_*` prefixed variables.
Then run:

```bash
npm run seed
```

This reloads the deterministic `generateEvents()` dataset into
`sourcing_events` and seeds `spend_baseline` for every FY, category, and region.

---

## Schema cheat sheet

| Table                | Purpose                                                       |
|----------------------|---------------------------------------------------------------|
| `profiles`           | App-level user row (role, email). Mirrored from `auth.users`. |
| `sourcing_events`    | All events - both seeded executive data and user requests.    |
| `spend_baseline`     | Addressable spend per (fy, category, region) cell.            |
| `feedback_responses` | Requestor NPS feedback submitted from email survey links.     |
| `audit_log`          | Append-only audit trail for security-sensitive data changes.  |
| `event_attachments`  | Metadata for files uploaded against a request. Binary in storage. |
| `client_errors`      | Production client runtime errors (boundary, window, rejections). |

## RLS cheat sheet

| Table                | Read          | Insert                   | Update                   | Delete                    |
|----------------------|---------------|--------------------------|--------------------------|---------------------------|
| `profiles`           | any signed-in | trigger only             | manual (SQL)             | cascade from `auth.users` |
| `sourcing_events`    | any signed-in | self request / admin     | admin or own planned     | admin or own planned      |
| `spend_baseline`     | any signed-in | admin only               | admin only               | admin only                |
| `feedback_responses` | admin / own   | own requested event only | own requested event only | blocked                   |
| `audit_log`          | admin only    | trigger only             | blocked                  | blocked                   |
| `event_attachments`  | any signed-in | owned object + allowed event | blocked                  | admin or uploader         |
| `client_errors`      | admin only    | self or anon             | blocked                  | blocked                   |

## Audit log retention

`0011_audit_log_retention.sql` adds `public.prune_audit_log(retention_days int default 180)`
which deletes rows older than the cutoff. On Supabase Pro/Team it also wires
a `pg_cron` job named `prune_audit_log_daily` that runs nightly at 03:00 UTC.
On Free tier pg_cron isn't available — invoke the function manually or from
an external scheduler:

```sql
select public.prune_audit_log(180);
```

To verify the schedule was registered (Pro/Team):

```sql
select jobname, schedule, command from cron.job where jobname = 'prune_audit_log_daily';
```

## RLS smoke tests

`tests/rls.test.ts` exercises real RLS policies against a throwaway Supabase
project. Provide these env vars (locally via `.env.test.local`, in CI via
secrets) to enable the suite:

```
SUPABASE_TEST_URL=
SUPABASE_TEST_ANON_KEY=
SUPABASE_TEST_USER_EMAIL=
SUPABASE_TEST_USER_PASSWORD=
SUPABASE_TEST_ADMIN_EMAIL=
SUPABASE_TEST_ADMIN_PASSWORD=
```

Preconditions:
- Test project has every migration applied.
- One profile is promoted to `admin`; another remains `user`.
- At least one seeded (non-request) event exists in `sourcing_events`.
- The `request-attachments` storage bucket exists from migration `0009`.

When any env var is missing the tests skip cleanly so local runs are unaffected.

## Audit log smoke test

After running `0007_audit_log.sql`, sign in as an admin, change an event status
or edit a spend baseline cell, then verify:

```sql
select table_name, operation, record_id, actor_email, changed_fields, created_at
from public.audit_log
order by created_at desc
limit 10;
```
