import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createRequestDraft,
  formatDraftSavedAt,
  parseStoredRequestDraft,
} from '../src/features/request-intake/hooks/useRequestDraft';
import type { RequestDraftFields } from '../src/features/request-intake/model/requestIntake.types';

function draftFields(overrides: Partial<RequestDraftFields> = {}): RequestDraftFields {
  return {
    eventDate: '2026-03-15',
    status: 'Planned',
    statusTouched: false,
    fyOverride: 'auto',
    eventId: 'EVT-FY26-0300',
    eventIdTouched: false,
    eventTypes: ['Reverse Auction'],
    requestorEmail: 'buyer@amcor.com',
    groupMode: 'multiple',
    groupRows: [
      { key: 'row-1', region: 'NA', spend: 1000 },
      { key: 'row-2', region: 'EMEA', spend: 0 },
    ],
    directness: 'Direct',
    category: 'Resins',
    subcategory: 'PE',
    shouldCostModeling: false,
    riskAssessment: true,
    esgAssessment: false,
    docType: 'Bid Template',
    ...overrides,
  };
}

test('createRequestDraft stamps the saved time without changing form fields', () => {
  const fields = draftFields({ eventId: 'EVT-FY26-0301', docType: 'Supplier List' });
  const draft = createRequestDraft(fields, '2026-06-28T12:00:00.000Z');

  assert.equal(draft.savedAt, '2026-06-28T12:00:00.000Z');
  assert.equal(draft.eventId, 'EVT-FY26-0301');
  assert.equal(draft.docType, 'Supplier List');
  assert.deepEqual(draft.groupRows, fields.groupRows);
});

test('parseStoredRequestDraft returns parsed drafts and reports malformed storage', () => {
  const parsed = parseStoredRequestDraft(JSON.stringify({ eventDate: '2026-03-15' }));
  const malformed = parseStoredRequestDraft('{not-json');

  assert.equal(parsed.error, null);
  assert.equal(parsed.draft?.eventDate, '2026-03-15');
  assert.equal(malformed.draft, null);
  assert.ok(malformed.error instanceof Error);
});

test('formatDraftSavedAt keeps empty and invalid draft states stable', () => {
  assert.equal(formatDraftSavedAt(null), 'Not saved yet');
  assert.equal(formatDraftSavedAt('not-a-date'), 'Draft saved');
});
