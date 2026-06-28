import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyFilters,
  baselineKey,
  computeTotals,
  coverageByCategory,
  pipelineByStatus,
  regionPerformance,
  savingsTrend,
  type Filters,
  type SpendBaseline,
} from '../src/domain/selectors';
import type { SourcingEvent } from '../src/domain/types';

const emptyFilters: Filters = {
  regions: [],
  fys: [],
  categories: [],
  subcategories: [],
  types: [],
};

function event(overrides: Partial<SourcingEvent>): SourcingEvent {
  return {
    id: 'EVT-FY26-0001',
    name: 'Resins - PE',
    fy: 'FY26',
    category: 'Resins',
    subcategory: 'PE',
    region: 'NA',
    type: 'Reverse Auction',
    status: 'Planned',
    addressable: 0,
    sourced: 0,
    savings: 0,
    startDate: '2025-07-15',
    ...overrides,
  };
}

const events: SourcingEvent[] = [
  event({
    id: 'EVT-FY26-0001',
    status: 'Completed',
    addressable: 700,
    sourced: 400,
    savings: 40,
    startDate: '2025-08-15',
  }),
  event({
    id: 'EVT-FY26-0002',
    subcategory: 'PP',
    region: 'EMEA',
    regions: ['EMEA', 'APAC'],
    businessGroups: [
      { region: 'EMEA', addressable: 350, sourced: 300 },
      { region: 'APAC', addressable: 250, sourced: 200 },
    ],
    type: 'RFQ',
    eventTypes: ['RFQ', 'Reverse Auction'],
    status: 'Live',
    addressable: 600,
    sourced: 500,
    savings: 0,
    startDate: '2025-11-01',
  }),
  event({
    id: 'EVT-FY26-0003',
    name: 'Logistics - Road',
    category: 'Logistics',
    subcategory: 'Road & LTL',
    region: 'NA',
    type: 'RFP',
    status: 'Planned',
    addressable: 300,
    sourced: 150,
    savings: 15,
    startDate: '2026-02-20',
  }),
];

const baseline: SpendBaseline = {
  [baselineKey('FY26', 'Resins', 'NA')]: 1_000,
  [baselineKey('FY26', 'Resins', 'EMEA')]: 900,
  [baselineKey('FY26', 'Resins', 'APAC')]: 700,
  [baselineKey('FY26', 'Logistics', 'NA')]: 500,
};

test('computeTotals uses scoped baseline for KPI coverage and savings rate', () => {
  const filters: Filters = {
    ...emptyFilters,
    regions: ['NA'],
    fys: ['FY26'],
    categories: ['Resins'],
  };
  const filtered = applyFilters(events, filters);
  const totals = computeTotals(filtered, filters, baseline);

  assert.equal(filtered.length, 1);
  assert.equal(totals.events, 1);
  assert.equal(totals.done, 1);
  assert.equal(totals.addressable, 1_000);
  assert.equal(totals.sourced, 400);
  assert.equal(totals.savings, 40);
  assert.equal(totals.coverage, 0.4);
  assert.equal(totals.savingsRate, 0.1);
});

test('filters match multi-region events and secondary event types', () => {
  const filtered = applyFilters(events, {
    ...emptyFilters,
    regions: ['APAC'],
    types: ['Reverse Auction'],
  });

  assert.deepEqual(filtered.map((item) => item.id), ['EVT-FY26-0002']);
});

test('coverage and region performance attribute multi-region sourced spend correctly', () => {
  const filters: Filters = {
    ...emptyFilters,
    fys: ['FY26'],
    regions: ['NA', 'EMEA', 'APAC'],
    categories: ['Resins'],
  };
  const filtered = applyFilters(events, filters);

  const categoryRows = coverageByCategory(filtered, filters, baseline);
  const resins = categoryRows.find((row) => row.category === 'Resins');
  assert.equal(resins?.addressable, 2_600);
  assert.equal(resins?.sourced, 900);
  assert.equal(resins?.coverage, 900 / 2_600);

  const regions = regionPerformance(filtered, filters, baseline);
  assert.equal(regions.find((row) => row.region === 'EMEA')?.sourced, 300);
  assert.equal(regions.find((row) => row.region === 'APAC')?.sourced, 200);
});

test('pipeline and savings trend keep operational buckets stable', () => {
  const pipeline = pipelineByStatus(events);
  assert.deepEqual(pipeline, [
    { status: 'Planned', count: 1, sourced: 150 },
    { status: 'Live', count: 1, sourced: 500 },
    { status: 'Completed', count: 1, sourced: 400 },
  ]);

  const trend = savingsTrend(events);
  assert.equal(trend.find((point) => point.label === 'FY26 Q1')?.savings, 40);
  assert.equal(trend.find((point) => point.label === 'FY26 Q3')?.savings, 15);
});
