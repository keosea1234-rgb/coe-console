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
    selectors.ts     filtering, aggregation, coverage, deep-dive, formatters
    store.ts         zustand store (events, filters, spend baseline)
  components/
    common/        Card, primitives (KPI, chips, selects…), overlays
    console/       TopBar, FilterBar, KpiRow, charts, matrix, grid, modals
    form/          (Phase 2)
  pages/         ConsolePage, RequestFormPage (placeholder)
  styles/        theme.ts, global.css
```

### Data flow (today vs. next phase)

All numbers derive from the event store. New events go through `store.addEvent()`,
which is the integration point for Phase 2: when the request form submits a Buyer
request, it pushes an event and every console figure (coverage, pipeline, savings)
recomputes automatically. The seeded generator (`generateEvents`) will simply be
swapped for the Supabase fetch.

The editable **Spend data** tab persists the addressable baseline to Supabase;
coverage = sourced / baseline.

## Deploy to Vercel

1. Push this folder to a Git repo.
2. In Vercel: **New Project → Import**. Framework preset = **Vite** (auto-detected).
3. Build command `npm run build`, output directory `dist` (defaults are correct).
4. `vercel.json` already adds the SPA rewrite so deep links (e.g. `/new-request`) work.

Or from the CLI: `npm i -g vercel && vercel`.

## Environment variables

In Vercel, set these required variables in **Project Settings -> Environment
Variables** for Production, Preview, and Development:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

`SUPABASE_SERVICE_ROLE_KEY` is local-only for `npm run seed`. Never add it to
Vercel or commit it to the repo.
