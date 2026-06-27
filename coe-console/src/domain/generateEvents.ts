import {
  REGIONS,
  REGION_W,
  FYS,
  FY_GROWTH,
  FY_RANGE,
  AUCTION_TYPES,
  type FY,
  type Region,
  type EventType,
  type Status,
} from './constants';
import { CATEGORIES, type Category } from './categories';
import type { SourcingEvent } from './types';

// --- Deterministic PRNG (mulberry32) -------------------------------------
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Stable string hash -> 0..1, used for per-cell jitter.
function hash01(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

// Categories that skew toward auctions (commoditised, high-volume spend).
const AUCTION_LEANING = new Set([
  'Resins',
  'Film',
  'Aluminium',
  'Paper',
  'Board',
  'Logistics',
  'Energy & Utility',
  'MRO',
]);

function pickType(cat: Category, r: () => number): EventType {
  const leans = AUCTION_LEANING.has(cat.name);
  const x = r();
  if (leans) {
    if (x < 0.5) return 'Reverse Auction';
    if (x < 0.62) return 'Forward Auction';
    if (x < 0.8) return 'RFQ';
    if (x < 0.93) return 'RFP';
    return 'RFI';
  }
  if (x < 0.12) return 'Reverse Auction';
  if (x < 0.16) return 'Forward Auction';
  if (x < 0.45) return 'RFQ';
  if (x < 0.8) return 'RFP';
  return 'RFI';
}

// FY-dependent status weighting: older FYs are mostly done, FY27 mostly planned.
function pickStatus(fy: FY, r: () => number): Status {
  const x = r();
  const w: Record<FY, [number, number, number]> = {
    // thresholds for [Completed, Awarded, Live] — remainder = Planned
    FY25: [0.78, 0.92, 0.98],
    FY26: [0.35, 0.55, 0.78],
    FY27: [0.05, 0.12, 0.22],
  };
  const [c, a, l] = w[fy];
  if (x < c) return 'Completed';
  if (x < a) return 'Awarded';
  if (x < l) return 'Live';
  return 'Planned';
}

function dateInFY(fy: FY, r: () => number): string {
  const { start, end } = FY_RANGE[fy];
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return new Date(s + (e - s) * r()).toISOString().slice(0, 10);
}

// Deterministic normalized subcategory weights for a category.
export function subWeights(cat: Category): number[] {
  const raw = cat.subcategories.map((sub, i) => 0.5 + hash01(`${cat.id}:${sub}:${i}`));
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map((v) => v / sum);
}

export function baselineAddr(fy: FY, cat: Category, region: Region): number {
  const jitter = 0.3 * hash01(`${fy}|${cat.id}|${region}`); // 0..0.3
  return cat.baseSpend * 1e6 * REGION_W[region] * FY_GROWTH[fy] * (0.85 + jitter);
}

export function generateEvents(seed = 20260624): SourcingEvent[] {
  const rng = mulberry32(seed);
  const events: SourcingEvent[] = [];
  let counter = 1;

  for (const fy of FYS) {
    for (const cat of CATEGORIES) {
      const weights = subWeights(cat);
      for (const region of REGIONS as Region[]) {
        const addr = baselineAddr(fy, cat, region);
        const coverageTarget = 0.2 + rng() * 0.58; // 20–78%
        const sourcedTotal = addr * coverageTarget;
        const nEvents = 1 + Math.floor(rng() * 3); // 1–3

        // distribute sourced across nEvents
        const splits: number[] = [];
        let remaining = sourcedTotal;
        for (let i = 0; i < nEvents; i++) {
          const isLast = i === nEvents - 1;
          const share = isLast ? remaining : remaining * (0.35 + rng() * 0.4);
          splits.push(share);
          remaining -= share;
        }

        splits.forEach((sourced) => {
          const type = pickType(cat, rng);
          const status = pickStatus(fy, rng);
          const isAuction = AUCTION_TYPES.includes(type);
          const realised =
            status === 'Awarded' || status === 'Completed'
              ? sourced * (isAuction ? 0.09 + rng() * 0.13 : 0.03 + rng() * 0.08)
              : 0;

          // pick a subcategory weighted by deterministic sub-weights
          let pick = rng();
          let subIdx = 0;
          for (let k = 0; k < weights.length; k++) {
            if (pick < weights[k]) {
              subIdx = k;
              break;
            }
            pick -= weights[k];
            subIdx = k;
          }
          const subcategory = cat.subcategories[subIdx];

          // addressable attributed to this event ~ proportional to its sourced share
          const addrShare = sourcedTotal > 0 ? sourced / sourcedTotal : 1 / nEvents;
          const eventAddr = addr * addrShare;

          const roundedAddr = Math.round(eventAddr);
          const roundedSourced = Math.round(sourced);
          events.push({
            id: `EVT-${fy}-${String(counter).padStart(4, '0')}`,
            name: `${cat.name} · ${subcategory} (${region})`,
            fy,
            category: cat.name,
            subcategory,
            region,
            regions: [region],
            businessGroups: [{ region, addressable: roundedAddr, sourced: roundedSourced }],
            type,
            status,
            addressable: roundedAddr,
            sourced: roundedSourced,
            savings: Math.round(realised),
            startDate: dateInFY(fy, rng),
          });
          counter++;
        });
      }
    }
  }

  return events;
}
