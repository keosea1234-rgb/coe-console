import assert from 'node:assert/strict';
import test from 'node:test';
import { createConsoleStore } from '../src/domain/storeFactory';
import type {
  BaselineCellInput,
  ConsoleRepository,
  StoreUser,
} from '../src/domain/storeTypes';
import type { FeedbackResponse, SourcingEvent } from '../src/domain/types';
import type { SpendBaseline } from '../src/domain/selectors';

function requestEvent(id = 'EVT-FY26-0100'): SourcingEvent {
  return {
    id,
    name: 'Resins - PE',
    fy: 'FY26',
    category: 'Resins',
    subcategory: 'PE',
    region: 'NA',
    regions: ['NA'],
    businessGroups: [{ region: 'NA', addressable: 125_000, sourced: 125_000 }],
    type: 'Reverse Auction',
    eventTypes: ['Reverse Auction'],
    status: 'Planned',
    addressable: 125_000,
    sourced: 125_000,
    savings: 0,
    startDate: '2026-02-10',
    requestor: 'buyer@amcor.com',
    directness: 'Direct',
    requestCreatedAt: '2026-06-28T09:00:00.000Z',
  };
}

function createMemoryRepository() {
  const events: SourcingEvent[] = [];
  const feedbackResponses: FeedbackResponse[] = [];
  const baseline: SpendBaseline = {};
  const calls: Array<{ name: string; args: unknown[] }> = [];

  const repository: ConsoleRepository = {
    listEvents: async () => events,
    insertEvent: async (event, requestorId) => {
      calls.push({ name: 'insertEvent', args: [event.id, requestorId] });
      events.unshift(event);
    },
    deleteEvent: async (id) => {
      calls.push({ name: 'deleteEvent', args: [id] });
      const index = events.findIndex((event) => event.id === id);
      if (index >= 0) events.splice(index, 1);
    },
    archiveEvent: async (id, actorId, archivedAt) => {
      calls.push({ name: 'archiveEvent', args: [id, actorId, archivedAt] });
      const index = events.findIndex((event) => event.id === id);
      if (index >= 0) events[index] = { ...events[index], archivedAt, archivedBy: actorId };
    },
    updateEventStatus: async (id, status) => {
      calls.push({ name: 'updateEventStatus', args: [id, status] });
      const index = events.findIndex((event) => event.id === id);
      if (index >= 0) events[index] = { ...events[index], status };
    },
    markFeedbackRequested: async (id) => {
      calls.push({ name: 'markFeedbackRequested', args: [id] });
      const index = events.findIndex((event) => event.id === id);
      if (index >= 0) events[index] = { ...events[index], feedbackRequested: true };
    },
    listFeedbackResponses: async () => feedbackResponses,
    upsertFeedbackResponse: async (input) => {
      calls.push({ name: 'upsertFeedbackResponse', args: [input.eventId, input.requestorId] });
      const response: FeedbackResponse = {
        id: `fb-${feedbackResponses.length + 1}`,
        eventId: input.eventId,
        requestorId: input.requestorId,
        requestorEmail: input.requestorEmail,
        toolScore: input.toolScore,
        supportScore: input.supportScore,
        comment: input.comment,
        createdAt: '2026-06-28T12:05:00.000Z',
        updatedAt: '2026-06-28T12:05:00.000Z',
      };
      feedbackResponses.unshift(response);
      return response;
    },
    listBaseline: async () => baseline,
    upsertBaselineCell: async (fy, category, region, value) => {
      calls.push({ name: 'upsertBaselineCell', args: [fy, category, region, value] });
      baseline[`${fy}|${category}|${region}`] = value;
    },
    deleteBaselineCell: async (fy, category, region) => {
      calls.push({ name: 'deleteBaselineCell', args: [fy, category, region] });
      delete baseline[`${fy}|${category}|${region}`];
    },
    bulkUpsertBaseline: async (rows: BaselineCellInput[]) => {
      calls.push({ name: 'bulkUpsertBaseline', args: [rows.length] });
      for (const row of rows) baseline[`${row.fy}|${row.category}|${row.region}`] = row.value;
    },
    clearBaseline: async () => {
      calls.push({ name: 'clearBaseline', args: [] });
      for (const key of Object.keys(baseline)) delete baseline[key];
    },
  };

  return { repository, calls };
}

test('request intake, admin workflow, and buyer feedback stay in sync', async () => {
  const { repository, calls } = createMemoryRepository();
  const buyer: StoreUser = { id: 'buyer-1', email: 'buyer@amcor.com' };
  const admin: StoreUser = { id: 'admin-1', email: 'admin@amcor.com' };
  let currentUser: StoreUser | null = buyer;

  const store = createConsoleStore({
    repository,
    getCurrentUser: () => currentUser,
    now: () => '2026-06-28T12:00:00.000Z',
  });

  const created = requestEvent();
  await store.getState().addEvent(created);
  assert.equal(store.getState().events[0].id, created.id);
  assert.deepEqual(calls.find((call) => call.name === 'insertEvent')?.args, [
    created.id,
    buyer.id,
  ]);

  currentUser = admin;
  await store.getState().updateEventStatus(created.id, 'Live');
  await store.getState().requestEventFeedback(created.id);
  await store.getState().archiveEvent(created.id);

  const archived = store.getState().events.find((event) => event.id === created.id);
  assert.equal(archived?.status, 'Live');
  assert.equal(archived?.feedbackRequested, true);
  assert.equal(archived?.archivedAt, '2026-06-28T12:00:00.000Z');
  assert.equal(archived?.archivedBy, admin.id);

  currentUser = buyer;
  const result = await store.getState().submitFeedbackResponse({
    eventId: created.id,
    toolScore: 9,
    supportScore: 8,
    comment: 'Helpful follow-up',
  });

  assert.equal(result.error, null);
  assert.equal(store.getState().feedbackResponses[0]?.eventId, created.id);
  assert.equal(store.getState().feedbackResponses[0]?.requestorId, buyer.id);
  assert.deepEqual(calls.find((call) => call.name === 'archiveEvent')?.args, [
    created.id,
    admin.id,
    '2026-06-28T12:00:00.000Z',
  ]);
  assert.deepEqual(calls.find((call) => call.name === 'upsertFeedbackResponse')?.args, [
    created.id,
    buyer.id,
  ]);
});

test('optimistic status update rolls back when repository mutation fails', async () => {
  const { repository } = createMemoryRepository();
  const created = requestEvent('EVT-FY26-0101');
  const store = createConsoleStore({
    repository: {
      ...repository,
      updateEventStatus: async () => {
        throw new Error('database unavailable');
      },
    },
    getCurrentUser: () => ({ id: 'admin-1', email: 'admin@amcor.com' }),
    now: () => '2026-06-28T12:00:00.000Z',
  });

  store.setState({ events: [created] });
  const originalConsoleError = console.error;
  console.error = () => undefined;
  try {
    await store.getState().updateEventStatus(created.id, 'Live');
  } finally {
    console.error = originalConsoleError;
  }

  assert.equal(store.getState().events[0]?.status, 'Planned');
  assert.equal(store.getState().error, 'database unavailable');
});
