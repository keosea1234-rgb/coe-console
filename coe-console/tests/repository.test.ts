import assert from 'node:assert/strict';
import test from 'node:test';
import type { SourcingEvent } from '../src/domain/types';

process.env.VITE_SUPABASE_URL ??= 'http://127.0.0.1:54321';
process.env.VITE_SUPABASE_ANON_KEY ??= 'test-anon-key';

const { eventsOrDemoFallback, mapDashboardSummaryRow } = await import('../src/domain/repository');

const existingEvent: SourcingEvent = {
  id: 'EVT-FY26-0300',
  name: 'Existing event',
  fy: 'FY26',
  category: 'Resins',
  subcategory: 'PE',
  region: 'NA',
  type: 'RFQ',
  status: 'Planned',
  addressable: 10_000,
  sourced: 0,
  savings: 0,
  startDate: '2026-03-01',
};

test('demo events only appear when demo mode is explicitly enabled', () => {
  const previousDemoMode = process.env.VITE_DEMO_MODE;

  try {
    delete process.env.VITE_DEMO_MODE;
    assert.deepEqual(eventsOrDemoFallback([]), []);

    process.env.VITE_DEMO_MODE = 'false';
    assert.deepEqual(eventsOrDemoFallback([]), []);

    process.env.VITE_DEMO_MODE = 'true';
    assert.ok(eventsOrDemoFallback([]).length > 0);

    assert.deepEqual(eventsOrDemoFallback([existingEvent]), [existingEvent]);
  } finally {
    if (previousDemoMode === undefined) delete process.env.VITE_DEMO_MODE;
    else process.env.VITE_DEMO_MODE = previousDemoMode;
  }
});

test('dashboard summary mapper normalizes rpc totals and grouped buckets', () => {
  const summary = mapDashboardSummaryRow({
    total_addressable: '1000.50',
    total_sourced: '425.25',
    total_savings: 42.5,
    total_events: '3',
    live_events: 1,
    completed_events: '2',
    status_counts: [
      { status: 'Live', count: '1', sourced: '125.25' },
      { status: 'Completed', count: 2, sourced: '300' },
      { status: 'Awarded', count: 99, sourced: 99 },
    ],
    category_counts: JSON.stringify([
      { category: 'Resins', count: '2', sourced: '300' },
      { category: 'Logistics', event_count: 1, sourced: 125.25 },
    ]),
    region_counts: [
      { region: 'NA', count: '2', sourced: '325.25' },
      { region: 'EMEA', event_count: 1, sourced: '100' },
      { region: 'MARS', count: 1, sourced: 1 },
    ],
  });

  assert.equal(summary.totals.events, 3);
  assert.equal(summary.totals.addressable, 1000.5);
  assert.equal(summary.totals.coverage, 425.25 / 1000.5);
  assert.deepEqual(summary.statusBuckets, [
    { status: 'Planned', count: 0, sourced: 0 },
    { status: 'Live', count: 1, sourced: 125.25 },
    { status: 'Completed', count: 2, sourced: 300 },
  ]);
  assert.deepEqual(summary.categoryCounts, [
    { category: 'Resins', count: 2, sourced: 300 },
    { category: 'Logistics', count: 1, sourced: 125.25 },
  ]);
  assert.deepEqual(summary.regionCounts, [
    { region: 'NA', count: 2, sourced: 325.25 },
    { region: 'EMEA', count: 1, sourced: 100 },
  ]);
});
