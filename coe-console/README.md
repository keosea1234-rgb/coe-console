# eSourcing CoE — Event & Coverage Console

Executive + operational analytics console for the Amcor eSourcing Center of Excellence.
Built with **Vite + React + TypeScript**. Phase 1 ships the Console on deterministic
synthetic data; the Buyer-facing request form and Supabase backend are Phase 2.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (default http://localhost:5173).

```bash
npm run build     # type-check + production build into /dist
npm run test:run  # selector + store workflow tests
npm run preview   # serve the production build locally
```

## Architecture

```
src/
  domain/        # framework-agnostic core (no React)
    constants.ts     regions, FYs, types, statuses, palette tokens
    categories.ts    19 categories: colors, base spend, subcategories
    types.ts         SourcingEvent
    generateEvents.ts seeded PRNG synthetic dataset (deterministic)
    selectors.ts         filtering, aggregation, coverage, deep-dive, formatters
    store.ts             production zustand store entry point
    storeFactory.ts      dependency-injected store factory for tests
    storeFilters.ts      client/UI filter state
    storeServerState.ts  Supabase-backed server state + mutations
    repository.ts        Supabase repository and row mappers
    database.types.ts    local Supabase Database type contract
  components/
    common/        Card, primitives (KPI, chips, selects…), overlays
    console/       TopBar, FilterBar, KpiRow, charts, matrix, grid, modals
    form/          (Phase 2)
  pages/         ConsolePage, RequestFormPage (placeholder)
  styles/        theme.ts, global.css
```

### Data flow (today vs. next phase)

All numbers derive from the event store. Client state (filters) lives in
`storeFilters.ts`; server state (events, baseline, feedback and mutations) lives
in `storeServerState.ts`. New events go through `store.addEvent()`: when the
request form submits a Buyer request, it pushes an event and every console figure
(coverage, pipeline, savings) recomputes automatically.

The editable **Spend data** tab persists the addressable baseline to Supabase;
coverage = sourced / baseline.

### Enterprise eSourcing foundation

Sprint 7 adds normalized Supabase tables for future enterprise workflows:
organizations, org memberships, suppliers, supplier contacts, event
participation, RFx status history, approvals, document requirements, and
document submissions. These tables wrap the existing `sourcing_events` dashboard
model with org-scoped ownership, supplier participation, and compliance
structure, but the current UI intentionally continues to use `sourcing_events`
until those workflows are built.

Frontend route and action visibility uses a bridge permission model in
`src/domain/authz.ts`. Permissions are currently derived from `profiles.role`
for compatibility with existing `user` and `admin` accounts; Supabase RLS
remains the authoritative enforcement layer for data access.

### Production observability

Production builds capture sanitized browser runtime errors through
`src/lib/errorReporting.ts`, the React `ErrorBoundary`, and the `client_errors`
table. Admins can review recent reports in the Console **Errors** tab. See
`SECURITY.md` for what is captured, what is intentionally excluded, and the
production troubleshooting flow.

## Reliability checks

```bash
npm run lint      # TypeScript project check
npm run test:run  # Node test runner through tsx
npm run deploy:check # Vercel rewrite/header guard
npm run build     # type-check + Vite production build
```

Covered tests:

- KPI, coverage, region attribution, pipeline and savings trend selectors.
- Request form validation and event payload creation.
- Request intake -> admin status/feedback/archive -> buyer feedback store workflow.
- Client error reporting normalization, sanitization, and sink opt-in safety.
- RLS smoke suite (`tests/rls.test.ts`) — skipped without `SUPABASE_TEST_*`
  env vars; see `supabase/README.md` for the setup runbook.

## End-to-end (Playwright)

Playwright drives the production preview against a real Supabase test project.
It is opt-in: locally and in CI, the suite skips unless credentials are set.

```bash
npm install
npm run test:e2e:install   # download chromium with system deps
npm run build              # produces /dist that `npm run preview` serves
E2E_USER_EMAIL=... E2E_USER_PASSWORD=... \
E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... \
VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... \
  npm run test:e2e
```

In CI the `e2e` job runs only when the repository variable `E2E_ENABLED` is
`true` and the secrets above are configured. Optional vars enable the feedback
flow: `E2E_FEEDBACK_EVENT_ID`, `E2E_FEEDBACK_TOKEN`.

## Supabase types

`src/domain/database.types.ts` is the local typed contract used by the Supabase
client. After linking the Supabase CLI to the project, refresh it from the live
schema with:

```bash
npm run supabase:types
```

## Deploy to Vercel

1. Push this folder to a Git repo.
2. If the Git repository root contains the `coe-console/` folder, set Vercel
   **Root Directory** to `coe-console`.
2. In Vercel: **New Project → Import**. Framework preset = **Vite** (auto-detected).
3. Build command `npm run build`, output directory `dist` (defaults are correct).
4. `vercel.json` already adds the SPA rewrite so deep links (e.g. `/new-request`) work.
5. Make sure the Production domain points at this same Vercel project/root.

Or from the CLI: `npm i -g vercel && vercel`.

GitHub Actions CI runs `npm ci`, `npm run lint`, `npm run test:run`,
`npm run deploy:check`, and `npm run build` from the `coe-console` root before
deploy/merge.

## Environment variables

In Vercel, set these required variables in **Project Settings -> Environment
Variables** for Production, Preview, and Development:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Optional:

- `VITE_AUTH_SIGNUP_ENABLED=true` exposes public signup. Leave unset or `false`
  for production admin-created/invited users.
- `VITE_ENABLE_ACCOUNT_SWITCH=true` exposes the one-click admin/user switcher in
  controlled test deployments. Local dev only needs the account credentials
  below; the explicit flag is required outside `npm run dev`.
- `VITE_DEV_ADMIN_EMAIL`, `VITE_DEV_ADMIN_PASSWORD`, `VITE_DEV_USER_EMAIL`, and
  `VITE_DEV_USER_PASSWORD` power the account switcher. Use seeded test accounts
  only, never real production users.

`SUPABASE_SERVICE_ROLE_KEY` is local-only for `npm run seed`. Never add it to
Vercel or commit it to the repo.
