-- 0014_dashboard_summary.sql - server-side dashboard summary foundation
--
-- Provides an RPC summary path for the executive dashboard so React does not
-- have to load every sourcing event before computing top-level analytics.

-- ---- Dashboard filter indexes ---------------------------------------------
create index if not exists sourcing_events_fy_idx
  on public.sourcing_events (fy);

create index if not exists sourcing_events_status_idx
  on public.sourcing_events (status);

create index if not exists sourcing_events_category_idx
  on public.sourcing_events (category);

create index if not exists sourcing_events_region_idx
  on public.sourcing_events (region);

create index if not exists sourcing_events_created_at_idx
  on public.sourcing_events (created_at);

create index if not exists sourcing_events_requestor_idx
  on public.sourcing_events (requestor);

create index if not exists sourcing_events_requestor_id_idx
  on public.sourcing_events (requestor_id);

create index if not exists sourcing_events_regions_gin_idx
  on public.sourcing_events using gin (regions);

create index if not exists sourcing_events_event_types_gin_idx
  on public.sourcing_events using gin (event_types);

-- ---- Dashboard summary RPC -------------------------------------------------
create or replace function public.dashboard_summary(
  filter_fys fy[] default null,
  filter_statuses event_status[] default null,
  filter_categories text[] default null,
  filter_regions region[] default null,
  filter_subcategories text[] default null,
  filter_types event_type[] default null,
  filter_requestor_id uuid default null,
  filter_created_from timestamptz default null,
  filter_created_to timestamptz default null
)
returns table (
  total_addressable numeric,
  total_sourced numeric,
  total_savings numeric,
  total_events bigint,
  live_events bigint,
  completed_events bigint,
  status_counts jsonb,
  category_counts jsonb,
  region_counts jsonb
)
language sql
stable
security invoker
set search_path = public
as $$
  with matching_events as (
    select e.*
    from public.sourcing_events e
    where (coalesce(cardinality(filter_fys), 0) = 0 or e.fy = any(filter_fys))
      and (coalesce(cardinality(filter_statuses), 0) = 0 or e.status = any(filter_statuses))
      and (coalesce(cardinality(filter_categories), 0) = 0 or e.category = any(filter_categories))
      and (coalesce(cardinality(filter_subcategories), 0) = 0 or e.subcategory = any(filter_subcategories))
      and (
        coalesce(cardinality(filter_regions), 0) = 0
        or (
          case
            when e.regions is null or cardinality(e.regions) = 0 then array[e.region]::region[]
            else e.regions
          end
        ) && filter_regions
      )
      and (
        coalesce(cardinality(filter_types), 0) = 0
        or (
          case
            when e.event_types is null or cardinality(e.event_types) = 0 then array[e.type]::event_type[]
            else e.event_types
          end
        ) && filter_types
      )
      and (filter_requestor_id is null or e.requestor_id = filter_requestor_id)
      and (filter_created_from is null or e.created_at >= filter_created_from)
      and (filter_created_to is null or e.created_at < filter_created_to)
  ),
  baseline_addressable as (
    select coalesce(sum(b.value), 0)::numeric as value
    from public.spend_baseline b
    where coalesce(cardinality(filter_subcategories), 0) = 0
      and (coalesce(cardinality(filter_fys), 0) = 0 or b.fy = any(filter_fys))
      and (coalesce(cardinality(filter_categories), 0) = 0 or b.category = any(filter_categories))
      and (coalesce(cardinality(filter_regions), 0) = 0 or b.region = any(filter_regions))
  ),
  totals as (
    select
      coalesce(sum(me.addressable), 0)::numeric as event_addressable,
      coalesce(sum(me.sourced), 0)::numeric as sourced,
      coalesce(sum(me.savings), 0)::numeric as savings,
      count(*)::bigint as events,
      count(*) filter (where me.status = 'Live')::bigint as live,
      count(*) filter (where me.status = 'Completed')::bigint as completed
    from matching_events me
  ),
  status_rollup as (
    select
      s.status,
      s.ordinality,
      coalesce(count(me.id), 0)::bigint as event_count,
      coalesce(sum(me.sourced), 0)::numeric as sourced
    from unnest(enum_range(null::event_status)) with ordinality as s(status, ordinality)
    left join matching_events me on me.status = s.status
    group by s.status, s.ordinality
  ),
  category_rollup as (
    select
      me.category,
      count(*)::bigint as event_count,
      coalesce(sum(me.sourced), 0)::numeric as sourced
    from matching_events me
    group by me.category
  ),
  region_rollup as (
    select
      event_region.region,
      count(me.id)::bigint as event_count,
      coalesce(
        sum(
          case
            when me.business_groups is not null then coalesce(
              (
                select sum((group_row.value ->> 'sourced')::numeric)
                from jsonb_array_elements(me.business_groups) as group_row(value)
                where group_row.value ->> 'region' = event_region.region::text
              ),
              0
            )
            when me.region = event_region.region then me.sourced
            else 0
          end
        ),
        0
      )::numeric as sourced
    from matching_events me
    cross join lateral unnest(
      case
        when me.regions is null or cardinality(me.regions) = 0 then array[me.region]::region[]
        else me.regions
      end
    ) as event_region(region)
    where coalesce(cardinality(filter_regions), 0) = 0 or event_region.region = any(filter_regions)
    group by event_region.region
  ),
  status_json as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'status', sr.status,
          'count', sr.event_count,
          'sourced', sr.sourced
        )
        order by sr.ordinality
      ),
      '[]'::jsonb
    ) as value
    from status_rollup sr
  ),
  category_json as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'category', cr.category,
          'count', cr.event_count,
          'sourced', cr.sourced
        )
        order by cr.event_count desc, cr.category
      ),
      '[]'::jsonb
    ) as value
    from category_rollup cr
  ),
  region_json as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'region', rr.region,
          'count', rr.event_count,
          'sourced', rr.sourced
        )
        order by rr.region
      ),
      '[]'::jsonb
    ) as value
    from region_rollup rr
  )
  select
    case
      when coalesce(cardinality(filter_subcategories), 0) > 0 then totals.event_addressable
      else baseline_addressable.value
    end as total_addressable,
    totals.sourced as total_sourced,
    totals.savings as total_savings,
    totals.events as total_events,
    totals.live as live_events,
    totals.completed as completed_events,
    status_json.value as status_counts,
    category_json.value as category_counts,
    region_json.value as region_counts
  from totals, baseline_addressable, status_json, category_json, region_json;
$$;

revoke all on function public.dashboard_summary(
  fy[],
  event_status[],
  text[],
  region[],
  text[],
  event_type[],
  uuid,
  timestamptz,
  timestamptz
) from public;

grant execute on function public.dashboard_summary(
  fy[],
  event_status[],
  text[],
  region[],
  text[],
  event_type[],
  uuid,
  timestamptz,
  timestamptz
) to authenticated;

comment on function public.dashboard_summary(
  fy[],
  event_status[],
  text[],
  region[],
  text[],
  event_type[],
  uuid,
  timestamptz,
  timestamptz
) is
  'Returns dashboard KPI totals and event counts by status, category, and region for the supplied filters.';
