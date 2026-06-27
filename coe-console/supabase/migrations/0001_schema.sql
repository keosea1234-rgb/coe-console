-- ============================================================================
-- 0001_schema.sql — eSourcing CoE Console initial schema
--
-- Mirrors src/domain/types.ts (SourcingEvent) and src/domain/constants.ts
-- (FY, Region, EventType, Status enums). Run this first in the Supabase
-- SQL Editor.
-- ============================================================================

-- ---- Extensions ------------------------------------------------------------
create extension if not exists "pgcrypto";  -- for gen_random_uuid()

-- ---- Enums (mirror src/domain/constants.ts) --------------------------------
create type region       as enum ('NA', 'EMEA', 'APAC', 'LATAM');
create type fy           as enum ('FY25', 'FY26', 'FY27');
create type event_type   as enum ('Forward Auction', 'Reverse Auction', 'RFQ', 'RFP', 'RFI');
create type event_status as enum ('Planned', 'Live', 'Awarded', 'Completed');
create type directness   as enum ('Direct', 'Indirect');
create type user_role    as enum ('user', 'admin');

-- ---- profiles --------------------------------------------------------------
-- One row per auth.users record. Carries the application role + display info.
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  role        user_role not null default 'user',
  created_at  timestamptz not null default now()
);

comment on table public.profiles is
  'Application-level user metadata. Auto-populated by the on_auth_user_created trigger.';

-- ---- sourcing_events -------------------------------------------------------
-- One row per sourcing event. Mirrors the SourcingEvent TS interface.
create table public.sourcing_events (
  id                    text primary key,    -- human-readable, e.g. "EVT-FY25-0001"
  name                  text not null,
  fy                    fy not null,
  category              text not null,
  subcategory           text not null,
  region                region not null,                  -- primary / first region
  regions               region[],                          -- multi-region; null = single-region
  business_groups       jsonb,                             -- [{region, addressable, sourced}]
  type                  event_type not null,
  event_types           event_type[],                      -- multi-type; null = single-type
  status                event_status not null default 'Planned',
  addressable           numeric(14,2) not null default 0,
  sourced               numeric(14,2) not null default 0,
  savings               numeric(14,2) not null default 0,
  start_date            date not null,
  requestor             text,                              -- display name / email snapshot
  requestor_id          uuid references public.profiles(id) on delete set null,
  should_cost_modeling  boolean,
  risk_assessment       boolean,
  esg_assessment        boolean,
  directness            directness,
  feedback_requested    boolean not null default false,
  request_created_at    timestamptz,                       -- non-null = user-submitted request
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.sourcing_events is
  'Sourcing events — both seeded executive data and user-submitted requests.';

-- Hot query paths
create index sourcing_events_fy_idx           on public.sourcing_events (fy);
create index sourcing_events_status_idx       on public.sourcing_events (status);
create index sourcing_events_category_idx     on public.sourcing_events (category);
create index sourcing_events_requestor_id_idx on public.sourcing_events (requestor_id);

-- Keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger sourcing_events_touch_updated_at
  before update on public.sourcing_events
  for each row execute function public.touch_updated_at();

-- ---- spend_baseline --------------------------------------------------------
-- One row per (fy, category, region) cell. Mirrors the SpendBaseline map.
create table public.spend_baseline (
  fy         fy not null,
  category   text not null,
  region     region not null,
  value      numeric(14,2) not null check (value >= 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  primary key (fy, category, region)
);

comment on table public.spend_baseline is
  'Addressable spend baseline by (fy, category, region). Coverage = sourced / value.';

create trigger spend_baseline_touch_updated_at
  before update on public.spend_baseline
  for each row execute function public.touch_updated_at();

-- ---- Auto-create profile on signup -----------------------------------------
-- Supabase fires auth.users INSERT when signUp() completes; this trigger
-- mirrors the user into public.profiles with the default 'user' role.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
