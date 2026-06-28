# Security Notes

This project uses Supabase Auth, PostgreSQL row-level security, and Vercel
security headers. Security-sensitive authorization must be enforced in the
database, not only in React route guards.

## Current controls

- Supabase RLS gates reads and writes for profiles, sourcing events, spend
  baseline data, feedback responses, and audit logs.
- Admin privileges are resolved through `public.is_admin()`.
- `audit_log` is append-only through database triggers and readable only by
  admins.
- Vercel sends CSP, HSTS, frame, referrer, content-type, and permissions-policy
  headers.
- The service role key is local-only for seeding and must never be exposed to
  Vite or Vercel client environments.

## Sprint 1 follow-ups

- Add automated RLS integration tests before broad production rollout.
- Decide whether signup should be invite-only or restricted to approved email
  domains.
- Add dependency and secret scanning in CI.
- Define audit retention and export requirements with the business owner.
