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
- Production auth model is admin-created or invited Supabase users. Public
  signup is hidden unless `VITE_ALLOW_SIGNUP=true` is set intentionally.
- Attachment metadata inserts require an owned storage object and an event the
  caller is allowed to attach to.
- Attachment metadata and request attachment downloads are limited to admins,
  uploaders, or the requestor tied to the event.

## RLS smoke tests

`tests/rls.test.ts` runs against a throwaway Supabase project when
`SUPABASE_TEST_*` credentials are configured. Without those env vars the tests
skip locally, but they still document the expected profile, event, attachment,
audit, baseline, and client-error policy behavior.

## Sprint 1 follow-ups

- Add dependency and secret scanning in CI.
- Define audit retention and export requirements with the business owner.
