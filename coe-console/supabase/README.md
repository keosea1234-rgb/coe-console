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

For each file: paste the contents -> **Run**. You should see a "Success. No rows returned." message. If a statement fails partway through, fix the cause and re-run the whole file.

## 3. Grab your API credentials

In the dashboard: **Settings -> API**.

- `Project URL` -> the value of `VITE_SUPABASE_URL`
- `anon public` key -> the value of `VITE_SUPABASE_ANON_KEY`

Paste these into `coe-console/.env.local` (see `.env.example`). Never commit `.env.local`, and **never** share the `service_role` key - it bypasses RLS.

## 4. Create your first users + promote an admin

1. In the dashboard: **Authentication -> Users -> Add user** (or sign up from the app once auth is wired). Create at least one user that will become the CoE admin.
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

## RLS cheat sheet

| Table                | Read          | Insert                   | Update                   | Delete                    |
|----------------------|---------------|--------------------------|--------------------------|---------------------------|
| `profiles`           | any signed-in | trigger only             | manual (SQL)             | cascade from `auth.users` |
| `sourcing_events`    | any signed-in | self request / admin     | admin or own planned     | admin or own planned      |
| `spend_baseline`     | any signed-in | admin only               | admin only               | admin only                |
| `feedback_responses` | admin / own   | own requested event only | own requested event only | blocked                   |
