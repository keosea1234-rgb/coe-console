import { CATEGORIES } from './categories';
import { FYS, REGIONS } from './constants';
import { baselineAddr } from './generateEvents';
import { baselineKey, type SpendBaseline } from './selectors';
import type {
  BaselineCellInput,
  ConsoleGet,
  ConsoleSet,
  ServerDataState,
  ServerState,
  ServerStateDeps,
} from './storeTypes';

export function createInitialServerState(): ServerDataState {
  return {
    events: [],
    loading: true,
    error: null,
    baseline: {},
    baselineLoading: true,
    feedbackResponses: [],
    feedbackLoading: true,
  };
}

export function createServerStateSlice(
  set: ConsoleSet,
  get: ConsoleGet,
  deps: ServerStateDeps,
): ServerState {
  const { repository, getCurrentUser, now } = deps;

  return {
    ...createInitialServerState(),

    refreshEvents: async () => {
      set({ loading: true, error: null });
      try {
        const events = await repository.listEvents();
        set({ events, loading: false });
      } catch (err) {
        console.error('[store] refreshEvents failed', err);
        set({ loading: false, error: (err as Error).message });
      }
    },

    addEvent: async (event) => {
      const requestorId = getCurrentUser()?.id ?? null;
      const eventForState = requestorId ? { ...event, requestorId } : event;
      set((state) => ({ events: [eventForState, ...state.events] }));
      try {
        await repository.insertEvent(event, requestorId);
      } catch (err) {
        console.error('[store] insertEvent failed; reverting', err);
        set((state) => ({
          events: state.events.filter((x) => x.id !== event.id),
          error: (err as Error).message,
        }));
        throw err;
      }
    },

    removeEvent: async (id) => {
      const prev = get().events;
      set({ events: prev.filter((event) => event.id !== id) });
      try {
        await repository.deleteEvent(id);
      } catch (err) {
        console.error('[store] deleteEvent failed; reverting', err);
        set({ events: prev, error: (err as Error).message });
      }
    },

    archiveEvent: async (id) => {
      const user = getCurrentUser();
      if (!user) {
        set({ error: 'Sign in before archiving a request.' });
        return;
      }

      const prev = get().events;
      const archivedAt = now();
      set({
        events: prev.map((event) =>
          event.id === id ? { ...event, archivedAt, archivedBy: user.id } : event,
        ),
      });
      try {
        await repository.archiveEvent(id, user.id, archivedAt);
      } catch (err) {
        console.error('[store] archiveEvent failed; reverting', err);
        set({ events: prev, error: (err as Error).message });
      }
    },

    updateEventStatus: async (id, status) => {
      const prev = get().events;
      set({ events: prev.map((event) => (event.id === id ? { ...event, status } : event)) });
      try {
        await repository.updateEventStatus(id, status);
      } catch (err) {
        console.error('[store] updateEventStatus failed; reverting', err);
        set({ events: prev, error: (err as Error).message });
      }
    },

    requestEventFeedback: async (id) => {
      const prev = get().events;
      set({
        events: prev.map((event) =>
          event.id === id ? { ...event, feedbackRequested: true } : event,
        ),
      });
      try {
        await repository.markFeedbackRequested(id);
      } catch (err) {
        console.error('[store] markFeedbackRequested failed; reverting', err);
        set({ events: prev, error: (err as Error).message });
      }
    },

    refreshFeedbackResponses: async () => {
      set({ feedbackLoading: true });
      try {
        const feedbackResponses = await repository.listFeedbackResponses();
        set({ feedbackResponses, feedbackLoading: false });
      } catch (err) {
        console.error('[store] refreshFeedbackResponses failed', err);
        set({ feedbackLoading: false, error: (err as Error).message });
      }
    },

    submitFeedbackResponse: async ({ eventId, toolScore, supportScore, comment }) => {
      const user = getCurrentUser();
      if (!user) return { error: 'Sign in before submitting feedback.' };

      try {
        const response = await repository.upsertFeedbackResponse({
          eventId,
          requestorId: user.id,
          requestorEmail: user.email,
          toolScore,
          supportScore,
          comment: comment?.trim() || undefined,
        });
        set((state) => ({
          feedbackResponses: [
            response,
            ...state.feedbackResponses.filter((x) => x.id !== response.id),
          ],
        }));
        return { error: null };
      } catch (err) {
        console.error('[store] submitFeedbackResponse failed', err);
        const message = (err as Error).message;
        set({ error: message });
        return { error: message };
      }
    },

    refreshBaseline: async () => {
      set({ baselineLoading: true });
      try {
        const baseline = await repository.listBaseline();
        set({ baseline, baselineLoading: false });
      } catch (err) {
        console.error('[store] refreshBaseline failed', err);
        set({ baselineLoading: false, error: (err as Error).message });
      }
    },

    setBaselineCell: async (fy, category, region, value) => {
      const prev = get().baseline;
      const key = baselineKey(fy, category, region);
      const next = { ...prev };
      if (!value || value <= 0) delete next[key];
      else next[key] = value;
      set({ baseline: next });

      try {
        if (!value || value <= 0) await repository.deleteBaselineCell(fy, category, region);
        else await repository.upsertBaselineCell(fy, category, region, value);
      } catch (err) {
        console.error('[store] setBaselineCell failed; reverting', err);
        set({ baseline: prev, error: (err as Error).message });
      }
    },

    prefillBaseline: async () => {
      const prev = get().baseline;
      const next: SpendBaseline = {};
      const rows: BaselineCellInput[] = [];

      for (const fy of FYS) {
        for (const category of CATEGORIES) {
          for (const region of REGIONS) {
            const value = Math.round(baselineAddr(fy, category, region));
            next[baselineKey(fy, category.name, region)] = value;
            rows.push({ fy, category: category.name, region, value });
          }
        }
      }

      set({ baseline: next });
      try {
        await repository.bulkUpsertBaseline(rows);
      } catch (err) {
        console.error('[store] prefillBaseline failed; reverting', err);
        set({ baseline: prev, error: (err as Error).message });
      }
    },

    clearBaseline: async () => {
      const prev = get().baseline;
      set({ baseline: {} });
      try {
        await repository.clearBaseline();
      } catch (err) {
        console.error('[store] clearBaseline failed; reverting', err);
        set({ baseline: prev, error: (err as Error).message });
      }
    },
  };
}
