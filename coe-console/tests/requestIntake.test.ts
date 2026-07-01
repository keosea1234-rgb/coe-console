import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildRequestEvent,
  validateRequestEventInput,
  type RequestEventInput,
} from '../src/domain/requestIntake';
import type { SourcingEvent } from '../src/domain/types';

function requestInput(overrides: Partial<RequestEventInput> = {}): RequestEventInput {
  return {
    eventDate: '2026-03-15',
    status: 'Planned',
    resolvedFy: 'FY26',
    eventId: 'EVT-FY26-0200',
    eventTypes: ['Reverse Auction', 'RFQ'],
    requestorEmail: ' buyer@amcor.com ',
    groupMode: 'multiple',
    groupRows: [
      { region: 'NA', spend: 100_000.49 },
      { region: 'EMEA', spend: 50_000.51 },
      { region: 'APAC', spend: 0 },
    ],
    directness: 'Direct',
    category: 'Resins',
    subcategory: 'PE',
    shouldCostModeling: true,
    riskAssessment: false,
    esgAssessment: true,
    ...overrides,
  };
}

const existingEvent: SourcingEvent = {
  id: 'EVT-FY26-0200',
  name: 'Existing',
  fy: 'FY26',
  category: 'Resins',
  subcategory: 'PE',
  region: 'NA',
  type: 'RFQ',
  status: 'Planned',
  addressable: 1,
  sourced: 1,
  savings: 0,
  startDate: '2026-01-01',
};

test('validateRequestEventInput catches duplicate ids, invalid email, and duplicate regions', () => {
  const errors = validateRequestEventInput(
    requestInput({
      requestorEmail: 'not-an-email',
      groupRows: [
        { region: 'NA', spend: 100 },
        { region: 'NA', spend: 200 },
      ],
    }),
    [existingEvent],
  );

  assert.equal(errors.requestorEmail, 'Enter a valid email address.');
  assert.equal(errors.eventId, 'Event ID already exists. Use a new ID or fiscal year.');
  assert.equal(errors.spend, 'NA is entered more than once. Use one row per business group.');
});

test('validateRequestEventInput rejects category/subcategory mismatches', () => {
  const errors = validateRequestEventInput(
    requestInput({ eventId: 'EVT-FY26-0201', category: 'Resins', subcategory: 'Ocean Freight' }),
    [],
  );

  assert.equal(errors.subcategory, 'Choose a valid subcategory for the selected category.');
});

test('buildRequestEvent normalizes payload for Supabase-backed store insert', () => {
  const event = buildRequestEvent(requestInput({ eventId: ' EVT-FY26-0201 ' }), '2026-06-28T12:00:00.000Z');

  assert.equal(event.id, 'EVT-FY26-0201');
  assert.equal(event.name, 'Resins - PE');
  assert.equal(event.requestor, 'buyer@amcor.com');
  assert.equal(event.region, 'NA');
  assert.deepEqual(event.regions, ['NA', 'EMEA']);
  assert.deepEqual(event.businessGroups, [
    { region: 'NA', addressable: 100_000, sourced: 0 },
    { region: 'EMEA', addressable: 50_001, sourced: 0 },
  ]);
  assert.equal(event.addressable, 150_001);
  assert.equal(event.sourced, 0);
  assert.equal(event.type, 'Reverse Auction');
  assert.deepEqual(event.eventTypes, ['Reverse Auction', 'RFQ']);
  assert.equal(event.requestCreatedAt, '2026-06-28T12:00:00.000Z');
});

test('single group mode ignores later spend rows', () => {
  const event = buildRequestEvent(
    requestInput({
      groupMode: 'single',
      groupRows: [
        { region: 'APAC', spend: 10_000 },
        { region: 'LATAM', spend: 90_000 },
      ],
    }),
    '2026-06-28T12:00:00.000Z',
  );

  assert.equal(event.region, 'APAC');
  assert.deepEqual(event.regions, ['APAC']);
  assert.equal(event.addressable, 10_000);
});
