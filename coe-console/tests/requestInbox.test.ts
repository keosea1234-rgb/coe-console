import assert from 'node:assert/strict';
import test from 'node:test';
import * as React from 'react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { AttachmentRow } from '../src/domain/attachments';
import type { SourcingEvent } from '../src/domain/types';

process.env.VITE_SUPABASE_URL ??= 'http://127.0.0.1:54321';
process.env.VITE_SUPABASE_ANON_KEY ??= 'test-anon-key';

(globalThis as { React?: typeof React }).React = React;

const { RequestInboxTable } = await import('../src/features/request-inbox/components/RequestInboxTable');
const {
  filterRequestInboxRequests,
  requestInboxRequests,
} = await import('../src/features/request-inbox/hooks/useRequestInboxFilters');
const {
  resolveAttachmentDownloadUrl,
  runRequestInboxAction,
} = await import('../src/features/request-inbox/hooks/useRequestInbox');

function requestEvent(overrides: Partial<SourcingEvent> = {}): SourcingEvent {
  return {
    id: 'EVT-FY26-0400',
    name: 'Resins - PE',
    fy: 'FY26',
    category: 'Resins',
    subcategory: 'PE',
    region: 'NA',
    regions: ['NA', 'EMEA'],
    type: 'RFQ',
    eventTypes: ['RFQ'],
    status: 'Planned',
    addressable: 250_000,
    sourced: 0,
    savings: 0,
    startDate: '2026-03-15',
    requestor: 'buyer@amcor.com',
    requestCreatedAt: '2026-06-28T12:00:00.000Z',
    ...overrides,
  };
}

function attachmentRow(overrides: Partial<AttachmentRow> = {}): AttachmentRow {
  return {
    id: 'att-1',
    event_id: 'EVT-FY26-0400',
    doc_type: 'Bid Template',
    file_name: 'brief.pdf',
    storage_path: 'EVT-FY26-0400/brief.pdf',
    content_type: 'application/pdf',
    size_bytes: 2048,
    uploaded_by: 'admin-1',
    uploaded_at: '2026-06-28T12:01:00.000Z',
    ...overrides,
  };
}

test('request inbox filters active rows and preserves newest-first ordering', () => {
  const active = requestEvent({ id: 'EVT-A', requestCreatedAt: '2026-06-28T12:00:00.000Z' });
  const archived = requestEvent({
    id: 'EVT-B',
    requestCreatedAt: '2026-06-29T12:00:00.000Z',
    archivedAt: '2026-06-30T12:00:00.000Z',
  });
  const nonRequest = requestEvent({ id: 'EVT-C', requestCreatedAt: undefined });

  const requests = requestInboxRequests([active, archived, nonRequest]);
  const visible = filterRequestInboxRequests(requests, 'active');

  assert.deepEqual(requests.map((event) => event.id), ['EVT-B', 'EVT-A']);
  assert.deepEqual(visible.map((event) => event.id), ['EVT-A']);
});

test('RequestInboxTable renders request rows and attachment actions', () => {
  const event = requestEvent();
  const html = renderToStaticMarkup(
    createElement(RequestInboxTable, {
      requests: [event],
      visible: [event],
      filter: 'active',
      totalSpend: event.addressable,
      activeCount: 1,
      archivedCount: 0,
      actionError: null,
      feedbackResponses: [],
      attachmentsByEvent: { [event.id]: [attachmentRow()] },
      attachmentLoadError: null,
      attachmentDownloadUrls: {},
      downloadUrlError: null,
      downloadingAttachmentId: null,
      actionState: null,
      onFilterChange: () => undefined,
      onSelectRequest: () => undefined,
      onDownloadAttachment: () => undefined,
      onRequestFeedback: () => undefined,
      onUpdateStatus: () => undefined,
      onRejectArchive: () => undefined,
      onRestoreRequest: () => undefined,
    }),
  );

  assert.match(html, /Request inbox/);
  assert.match(html, /buyer@amcor\.com/);
  assert.match(html, /Resins - PE/);
  assert.match(html, /brief\.pdf/);
  assert.match(html, /Prepare download/);
});

test('runRequestInboxAction wraps status updates with loading and safe errors', async () => {
  const states: unknown[] = [];
  const errors: Array<string | null> = [];
  let called = false;

  const ok = await runRequestInboxAction({
    eventId: 'EVT-FY26-0400',
    kind: 'update-status',
    action: async () => {
      called = true;
    },
    setActionState: (state) => states.push(state),
    setActionError: (message) => errors.push(message),
    safeError: 'Unable to update this request status right now.',
    clearError: () => undefined,
    getStoreError: () => null,
  });

  assert.equal(ok, true);
  assert.equal(called, true);
  assert.deepEqual(states[0], { eventId: 'EVT-FY26-0400', kind: 'update-status' });
  assert.equal(states.at(-1), null);
  assert.deepEqual(errors, [null]);
});

test('resolveAttachmentDownloadUrl only creates signed URLs when missing from cache', async () => {
  const attachment = attachmentRow();
  let createCalls = 0;

  const cached = await resolveAttachmentDownloadUrl(
    attachment,
    { [attachment.id]: 'https://download.example/cached' },
    async () => {
      createCalls += 1;
      return 'https://download.example/new';
    },
  );

  const generated = await resolveAttachmentDownloadUrl(attachment, {}, async () => {
    createCalls += 1;
    return 'https://download.example/new';
  });

  assert.deepEqual(cached, { url: 'https://download.example/cached', generated: false });
  assert.deepEqual(generated, { url: 'https://download.example/new', generated: true });
  assert.equal(createCalls, 1);
});
