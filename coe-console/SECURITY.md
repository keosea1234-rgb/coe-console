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
- Client runtime errors are sanitized before being written to `client_errors`;
  admins can inspect recent reports from the Console Errors tab.

## Client error reporting

Production builds install browser-level `error` and `unhandledrejection`
handlers plus the React `ErrorBoundary`. Reports include:

- UTC report time from the database and client-side `createdAt`.
- Source (`error-boundary`, `window-error`, or `unhandled-rejection`).
- Current route path, without query string values.
- Sanitized message, stack, and React component stack.
- Browser user agent and `VITE_APP_VERSION` when configured.
- Authenticated `actor_id` when available.

Reports intentionally do not include procurement form payloads, supplier bid
values, attachment contents, Supabase tokens, bearer tokens, API keys, passwords,
or actor email by default. Non-`Error` rejection objects are summarized by key
names rather than serialized with values. The frontend sanitization is a safety
net; avoid passing sensitive business data into thrown error messages.

To troubleshoot production issues:

1. Sign in as an admin.
2. Open the Console **Errors** tab.
3. Review the route, source, timestamp, sanitized message, and stack.
4. Correlate `actor_id`, app version, and deployment time with Vercel logs or
   Supabase logs.
5. If errors repeat, verify whether they happen before or after auth, then check
   the corresponding RLS policy and network request in browser dev tools.

## RLS smoke tests

`tests/rls.test.ts` runs against a throwaway Supabase project when
`SUPABASE_TEST_*` credentials are configured. Without those env vars the tests
skip locally, but they still document the expected profile, event, attachment,
audit, baseline, and client-error policy behavior.

## Sprint 1 follow-ups

- Add dependency and secret scanning in CI.
- Define audit retention and export requirements with the business owner.
