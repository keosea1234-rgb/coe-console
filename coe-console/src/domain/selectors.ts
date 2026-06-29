import {
  REGIONS,
  FYS,
  AUCTION_TYPES,
  type FY,
  type Region,
  type EventType,
  type Status,
} from './constants';
import { CATEGORIES, CATEGORY_BY_NAME } from './categories';
import { baselineAddr, subWeights } from './generateEvents';
import type { SourcingEvent } from './types';

// --- Filters --------------------------------------------------------------
export interface Filters {
  regions: Region[]; // empty = all
  fys: FY[]; // empty = all
  categories: string[]; // empty = all
  subcategories: string[]; // empty = all
  types: EventType[]; // empty = all
}

export const EMPTY_FILTERS: Filters = {
  regions: [],
  fys: [],
  categories: [],
  subcategories: [],
  types: [],
};

export function applyFilters(events: SourcingEvent[], f: Filters): SourcingEvent[] {
  return events.filter((e) => {
    if (f.regions.length && !f.regions.some((r) => eventRegions(e).includes(r))) return false;
    if (f.fys.length && !f.fys.includes(e.fy)) return false;
    if (f.categories.length && !f.categories.includes(e.category)) return false;
    if (f.subcategories.length && !f.subcategories.includes(e.subcategory)) return false;
    if (f.types.length && !f.types.some((type) => eventHasType(e, type))) return false;
    return true;
  });
}

export interface RequestOwner {
  id: string;
  email: string;
}

export function isUserRequest(event: SourcingEvent, user: RequestOwner | null | undefined): boolean {
  if (!user || !event.requestCreatedAt) return false;
  if (event.requestorId && event.requestorId === user.id) return true;
  return !!event.requestor && event.requestor.toLowerCase() === user.email.toLowerCase();
}

export function myRequestEvents(
  events: SourcingEvent[],
  user: RequestOwner | null | undefined,
): SourcingEvent[] {
  return events
    .filter((event) => isUserRequest(event, user))
    .sort((a, b) => (b.requestCreatedAt ?? '').localeCompare(a.requestCreatedAt ?? ''));
}

function eventHasType(e: SourcingEvent, type: EventType): boolean {
  return (e.eventTypes ?? [e.type]).includes(type);
}

// All regions this event covers (multi-region events carry e.regions; generated events use e.region).
function eventRegions(e: SourcingEvent): Region[] {
  return e.regions ?? [e.region];
}

// Sourced spend attributed to a specific region for a given event.
function sourcedForRegion(e: SourcingEvent, region: Region): number {
  if (e.businessGroups) {
    return e.businessGroups.find((g) => g.region === region)?.sourced ?? 0;
  }
  return e.region === region ? e.sourced : 0;
}

function addressableForRegion(e: SourcingEvent, region: Region): number {
  if (e.businessGroups) {
    return e.businessGroups.find((g) => g.region === region)?.addressable ?? 0;
  }
  return e.region === region ? e.addressable : 0;
}

function savingsForRegion(e: SourcingEvent, region: Region): number {
  const sourced = sourcedForRegion(e, region);
  if (e.sourced > 0) return e.savings * (sourced / e.sourced);
  const addressable = addressableForRegion(e, region);
  return e.addressable > 0 ? e.savings * (addressable / e.addressable) : 0;
}

// --- Spend baseline (editable scope) -------------------------------------
// key = `${fy}|${category}|${region}`
export type SpendBaseline = Record<string, number>;
export const baselineKey = (fy: FY, cat: string, region: Region) => `${fy}|${cat}|${region}`;

// Addressable for a cell — manual baseline wins, otherwise event-derived estimate.
export function cellAddressable(
  fy: FY,
  catName: string,
  region: Region,
  baseline: SpendBaseline,
): number {
  const manual = baseline[baselineKey(fy, catName, region)];
  if (manual != null && manual > 0) return manual;
  const cat = CATEGORY_BY_NAME[catName];
  return cat ? baselineAddr(fy, cat, region) : 0;
}

// --- Aggregates -----------------------------------------------------------
export interface Totals {
  events: number;
  live: number;
  done: number;
  addressable: number;
  sourced: number;
  savings: number;
  coverage: number; // 0..1
  savingsRate: number; // 0..1 of sourced
}

function fyScope(f: Filters): FY[] {
  return f.fys.length ? f.fys : FYS;
}
function regionScope(f: Filters): Region[] {
  return f.regions.length ? f.regions : (REGIONS as Region[]);
}
function categoryScope(f: Filters): string[] {
  return f.categories.length ? f.categories : CATEGORIES.map((c) => c.name);
}

// Addressable for the current filter scope, summed from the baseline grid.
export function scopedAddressable(f: Filters, baseline: SpendBaseline): number {
  // When a subcategory is chosen, addressable falls back to event-level numbers.
  if (f.subcategories.length) return -1; // sentinel: caller uses event addressable instead
  const cats = categoryScope(f);
  let total = 0;
  for (const fy of fyScope(f)) {
    for (const cat of cats) {
      for (const region of regionScope(f)) {
        total += cellAddressable(fy, cat, region, baseline);
      }
    }
  }
  return total;
}

export function computeTotals(
  filtered: SourcingEvent[],
  f: Filters,
  baseline: SpendBaseline,
): Totals {
  const sourced = sum(filtered, (e) => e.sourced);
  const savings = sum(filtered, (e) => e.savings);
  let addressable = scopedAddressable(f, baseline);
  if (addressable < 0) addressable = sum(filtered, (e) => e.addressable);

  return {
    events: filtered.length,
    live: filtered.filter((e) => e.status === 'Live').length,
    done: filtered.filter((e) => e.status === 'Completed').length,
    addressable,
    sourced,
    savings,
    coverage: addressable > 0 ? Math.min(1, sourced / addressable) : 0,
    savingsRate: sourced > 0 ? savings / sourced : 0,
  };
}

// --- Coverage by category (sorted desc) ----------------------------------
export interface CategoryCoverage {
  category: string;
  color: string;
  addressable: number;
  sourced: number;
  savings: number;
  coverage: number;
}

export function coverageByCategory(
  filtered: SourcingEvent[],
  f: Filters,
  baseline: SpendBaseline,
): CategoryCoverage[] {
  const fys = fyScope(f);
  const regions = regionScope(f);
  const scopedCategories = new Set(categoryScope(f));
  const rows = CATEGORIES.filter((cat) => scopedCategories.has(cat.name)).map((cat) => {
    const evs = filtered.filter((e) => e.category === cat.name);
    const sourced = sum(evs, (e) => e.sourced);
    const savings = sum(evs, (e) => e.savings);
    let addressable = 0;
    if (f.subcategories.length) {
      addressable = sum(evs, (e) => e.addressable);
    } else {
      for (const fy of fys) for (const r of regions) addressable += cellAddressable(fy, cat.name, r, baseline);
    }
    return {
      category: cat.name,
      color: cat.color,
      addressable,
      sourced,
      savings,
      coverage: addressable > 0 ? Math.min(1, sourced / addressable) : 0,
    };
  });
  return rows.sort((a, b) => b.coverage - a.coverage);
}

// --- Region performance ---------------------------------------------------
export interface RegionPerf {
  region: Region;
  sourced: number;
  addressable: number;
  coverage: number;
  auctionShare: number; // 0..1 of sourced via auctions
}

export function regionPerformance(
  filtered: SourcingEvent[],
  f: Filters,
  baseline: SpendBaseline,
): RegionPerf[] {
  const fys = fyScope(f);
  const cats = categoryScope(f);
  return (REGIONS as Region[]).map((region) => {
    const evs = filtered.filter((e) => eventRegions(e).includes(region));
    const sourced = sum(evs, (e) => sourcedForRegion(e, region));
    const auctionSourced = sum(
      evs.filter((e) => AUCTION_TYPES.some((type) => eventHasType(e, type))),
      (e) => sourcedForRegion(e, region),
    );
    let addressable = 0;
    if (f.subcategories.length) addressable = sum(evs, (e) => e.addressable);
    else for (const fy of fys) for (const cat of cats) addressable += cellAddressable(fy, cat, region, baseline);
    return {
      region,
      sourced,
      addressable,
      coverage: addressable > 0 ? Math.min(1, sourced / addressable) : 0,
      auctionShare: sourced > 0 ? auctionSourced / sourced : 0,
    };
  });
}

// --- Pipeline by status ---------------------------------------------------
export interface StatusBucket {
  status: Status;
  count: number;
  sourced: number;
}
const STATUS_ORDER: Status[] = ['Planned', 'Live', 'Completed'];
export function pipelineByStatus(filtered: SourcingEvent[]): StatusBucket[] {
  return STATUS_ORDER.map((status) => {
    const evs = filtered.filter((e) => e.status === status);
    return { status, count: evs.length, sourced: sum(evs, (e) => e.sourced) };
  });
}

// --- Savings trend over 12 fiscal quarters --------------------------------
export interface QuarterPoint {
  label: string; // e.g. FY25 Q1
  savings: number;
}
export function savingsTrend(filtered: SourcingEvent[]): QuarterPoint[] {
  const points: QuarterPoint[] = [];
  for (const fy of FYS) {
    for (let q = 1; q <= 4; q++) {
      points.push({ label: `${fy} Q${q}`, savings: 0 });
    }
  }
  const idx = (fy: FY, q: number) => FYS.indexOf(fy) * 4 + (q - 1);
  for (const e of filtered) {
    if (e.savings <= 0) continue;
    const m = new Date(e.startDate).getMonth(); // 0..11, calendar
    // Amcor FY starts in July: Jul–Sep=Q1, Oct–Dec=Q2, Jan–Mar=Q3, Apr–Jun=Q4
    const q = m >= 6 ? Math.floor((m - 6) / 3) + 1 : Math.floor((m + 6) / 3) + 1;
    points[idx(e.fy, q)].savings += e.savings;
  }
  return points;
}

// --- Insights -------------------------------------------------------------
export interface Insights {
  auctionLeader: { region: Region; share: number };
  auctionLaggard: { region: Region; share: number };
  coverageGapCategory: { category: string; coverage: number };
  growthPipeline: { category: string; addressable: number };
}

export function buildInsights(
  filtered: SourcingEvent[],
  f: Filters,
  baseline: SpendBaseline,
): Insights {
  const rp = regionPerformance(filtered, f, baseline).filter((r) => r.sourced > 0);
  const sortedAuction = [...rp].sort((a, b) => b.auctionShare - a.auctionShare);
  const cc = coverageByCategory(filtered, f, baseline).filter((c) => c.addressable > 0);
  const lowest = [...cc].sort((a, b) => a.coverage - b.coverage)[0];

  // Largest FY27 planned addressable (uses full event set context via filtered planned)
  const fy27planned = filtered.filter((e) => e.fy === 'FY27' && e.status === 'Planned');
  const byCat = new Map<string, number>();
  for (const e of fy27planned) byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.addressable);
  let growthCat = '—';
  let growthVal = 0;
  for (const [cat, v] of byCat) if (v > growthVal) ((growthVal = v), (growthCat = cat));

  return {
    auctionLeader: sortedAuction[0]
      ? { region: sortedAuction[0].region, share: sortedAuction[0].auctionShare }
      : { region: 'NA', share: 0 },
    auctionLaggard: sortedAuction[sortedAuction.length - 1]
      ? {
          region: sortedAuction[sortedAuction.length - 1].region,
          share: sortedAuction[sortedAuction.length - 1].auctionShare,
        }
      : { region: 'LATAM', share: 0 },
    coverageGapCategory: lowest
      ? { category: lowest.category, coverage: lowest.coverage }
      : { category: '—', coverage: 0 },
    growthPipeline: { category: growthCat, addressable: growthVal },
  };
}

// --- Coverage matrix (category x region) ----------------------------------
export interface MatrixCell {
  coverage: number;
  sourced: number;
  addressable: number;
}
export function coverageMatrix(
  filtered: SourcingEvent[],
  f: Filters,
  baseline: SpendBaseline,
): { category: string; color: string; cells: Record<Region, MatrixCell> }[] {
  const fys = fyScope(f);
  const scopedCategories = new Set(categoryScope(f));
  return CATEGORIES.filter((cat) => scopedCategories.has(cat.name)).map((cat) => {
    const cells = {} as Record<Region, MatrixCell>;
    for (const region of REGIONS as Region[]) {
      const evs = filtered.filter((e) => e.category === cat.name && eventRegions(e).includes(region));
      const sourced = sum(evs, (e) => sourcedForRegion(e, region));
      let addressable = 0;
      if (f.subcategories.length) addressable = sum(evs, (e) => e.addressable);
      else for (const fy of fys) addressable += cellAddressable(fy, cat.name, region, baseline);
      cells[region] = {
        sourced,
        addressable,
        coverage: addressable > 0 ? Math.min(1, sourced / addressable) : 0,
      };
    }
    return { category: cat.name, color: cat.color, cells };
  });
}

// --- Region coverage detail ----------------------------------------------
export interface RegionSubcategoryCoverage {
  subcategory: string;
  addressable: number;
  sourced: number;
  savings: number;
  coverage: number;
  untapped: number;
  events: number;
}

export interface RegionCategoryCoverage {
  category: string;
  color: string;
  addressable: number;
  sourced: number;
  savings: number;
  coverage: number;
  untapped: number;
  events: number;
  subcategories: RegionSubcategoryCoverage[];
}

export interface RegionCoverageDetail {
  region: Region;
  addressable: number;
  sourced: number;
  savings: number;
  coverage: number;
  untapped: number;
  events: number;
  activeCategories: number;
  activeSubcategories: number;
  topGapCategory: string;
  topGapSubcategory: string;
  scope: string;
  categoryRows: RegionCategoryCoverage[];
}

export function regionCoverageDetail(
  filtered: SourcingEvent[],
  f: Filters,
  baseline: SpendBaseline,
  region: Region,
): RegionCoverageDetail {
  const fys = fyScope(f);
  const scopedCategories = new Set(categoryScope(f));
  const scopedSubcategories = new Set(f.subcategories);
  const regionEvents = filtered.filter((e) => eventRegions(e).includes(region));

  const categoryRows = CATEGORIES.filter((cat) => scopedCategories.has(cat.name)).map((cat) => {
    const catEvents = regionEvents.filter((e) => e.category === cat.name);
    const weights = subWeights(cat);
    const subcategories = cat.subcategories
      .map((sub, index) => ({ sub, index }))
      .filter(({ sub }) => !f.subcategories.length || scopedSubcategories.has(sub))
      .map(({ sub, index }) => {
        const subEvents = catEvents.filter((e) => e.subcategory === sub);
        const sourced = sum(subEvents, (e) => sourcedForRegion(e, region));
        const savings = sum(subEvents, (e) => savingsForRegion(e, region));
        const addressable = f.subcategories.length
          ? sum(subEvents, (e) => addressableForRegion(e, region))
          : sum(fys, (fy) => cellAddressable(fy, cat.name, region, baseline)) * weights[index];
        return {
          subcategory: sub,
          addressable,
          sourced,
          savings,
          coverage: addressable > 0 ? Math.min(1, sourced / addressable) : 0,
          untapped: Math.max(0, addressable - sourced),
          events: subEvents.length,
        };
      })
      .sort((a, b) => b.untapped - a.untapped);

    const sourced = sum(catEvents, (e) => sourcedForRegion(e, region));
    const savings = sum(catEvents, (e) => savingsForRegion(e, region));
    const addressable = f.subcategories.length
      ? sum(catEvents, (e) => addressableForRegion(e, region))
      : sum(fys, (fy) => cellAddressable(fy, cat.name, region, baseline));

    return {
      category: cat.name,
      color: cat.color,
      addressable,
      sourced,
      savings,
      coverage: addressable > 0 ? Math.min(1, sourced / addressable) : 0,
      untapped: Math.max(0, addressable - sourced),
      events: catEvents.length,
      subcategories,
    };
  });

  categoryRows.sort((a, b) => b.untapped - a.untapped);
  const topCategory = categoryRows[0];
  const topSubcategory = [...categoryRows.flatMap((row) => row.subcategories)].sort(
    (a, b) => b.untapped - a.untapped,
  )[0];
  const addressable = sum(categoryRows, (row) => row.addressable);
  const sourced = sum(categoryRows, (row) => row.sourced);
  const savings = sum(categoryRows, (row) => row.savings);

  return {
    region,
    addressable,
    sourced,
    savings,
    coverage: addressable > 0 ? Math.min(1, sourced / addressable) : 0,
    untapped: Math.max(0, addressable - sourced),
    events: regionEvents.length,
    activeCategories: categoryRows.filter((row) => row.sourced > 0 || row.addressable > 0).length,
    activeSubcategories: categoryRows.flatMap((row) => row.subcategories).filter((row) => row.sourced > 0).length,
    topGapCategory: topCategory?.category ?? '-',
    topGapSubcategory: topSubcategory?.subcategory ?? '-',
    scope: `${fys.join(', ')} - ${f.categories.length ? f.categories.join(', ') : 'All categories'}`,
    categoryRows,
  };
}

// --- Subcategory deep-dive ------------------------------------------------
export interface SubRow {
  subcategory: string;
  addressable: number;
  sourced: number;
  savings: number;
  coverage: number;
  untapped: number;
  auctionShare: number;
  events: number;
  regionRows: SubRegionRow[];
}
export interface SubRegionRow {
  region: Region;
  addressable: number;
  sourced: number;
  savings: number;
  coverage: number;
  untapped: number;
  auctionShare: number;
  events: number;
}
export interface DeepDive {
  category: string;
  color: string;
  addressable: number;
  sourced: number;
  coverage: number;
  untapped: number;
  events: number;
  focus: string; // largest-gap subcategory
  rows: SubRow[];
  scope: string;
}

export function deepDive(
  catName: string,
  filtered: SourcingEvent[],
  f: Filters,
  baseline: SpendBaseline,
): DeepDive {
  const cat = CATEGORY_BY_NAME[catName];
  const evs = filtered.filter((e) => e.category === catName);
  const weights = subWeights(cat);
  const fys = fyScope(f);
  const regions = regionScope(f);

  // category total addressable from baseline grid (or event fallback under subcat filter)
  let catAddr = 0;
  if (f.subcategories.length) catAddr = sum(evs, (e) => e.addressable);
  else for (const fy of fys) for (const r of regions) catAddr += cellAddressable(fy, catName, r, baseline);

  const rows: SubRow[] = cat.subcategories.map((sub, i) => {
    const regionRows = regions.map((region) => {
      const regionEvs = evs.filter((e) => e.subcategory === sub && eventRegions(e).includes(region));
      const sourced = sum(regionEvs, (e) => sourcedForRegion(e, region));
      const savings = sum(regionEvs, (e) => e.savings);
      const addressable = f.subcategories.length
        ? sum(regionEvs, (e) => e.addressable)
        : sum(fys, (fy) => cellAddressable(fy, catName, region, baseline)) * weights[i];
      const auctionSourced = sum(
        regionEvs.filter((e) => AUCTION_TYPES.some((type) => eventHasType(e, type))),
        (e) => e.sourced,
      );
      return {
        region,
        addressable,
        sourced,
        savings,
        coverage: addressable > 0 ? Math.min(1, sourced / addressable) : 0,
        untapped: Math.max(0, addressable - sourced),
        auctionShare: sourced > 0 ? auctionSourced / sourced : 0,
        events: regionEvs.length,
      };
    });
    const sourced = sum(regionRows, (r) => r.sourced);
    const savings = sum(regionRows, (r) => r.savings);
    const addressable = sum(regionRows, (r) => r.addressable);
    const auctionSourced = sum(regionRows, (r) => r.sourced * r.auctionShare);
    const coverage = addressable > 0 ? Math.min(1, sourced / addressable) : 0;
    return {
      subcategory: sub,
      addressable,
      sourced,
      savings,
      coverage,
      untapped: Math.max(0, addressable - sourced),
      auctionShare: sourced > 0 ? auctionSourced / sourced : 0,
      events: sum(regionRows, (r) => r.events),
      regionRows,
    };
  });
  rows.sort((a, b) => b.untapped - a.untapped);

  const sourced = sum(evs, (e) => e.sourced);
  return {
    category: catName,
    color: cat.color,
    addressable: catAddr,
    sourced,
    coverage: catAddr > 0 ? Math.min(1, sourced / catAddr) : 0,
    untapped: Math.max(0, catAddr - sourced),
    events: evs.length,
    focus: rows[0]?.subcategory ?? '—',
    rows,
    scope: `${fys.join(', ')} - ${regions.length === REGIONS.length ? 'All regions' : regions.join(', ')}`,
  };
}

// --- Helpers --------------------------------------------------------------
function sum<T>(arr: T[], f: (x: T) => number): number {
  return arr.reduce((a, x) => a + f(x), 0);
}

// --- Formatters -----------------------------------------------------------
export function fmtUSD(v: number, currency = '$'): string {
  const abs = Math.abs(v);
  if (abs >= 1e9) return `${currency}${(v / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${currency}${(v / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${currency}${(v / 1e3).toFixed(0)}K`;
  return `${currency}${Math.round(v)}`;
}
export function fmtPct(v: number, digits = 0): string {
  return `${(v * 100).toFixed(digits)}%`;
}
export function fmtNum(v: number): string {
  return v.toLocaleString('en-US');
}
