import { create } from 'zustand';
import { REGIONS, FYS, type FY, type Region, type Status } from './constants';
import { CATEGORIES, CATEGORY_BY_NAME } from './categories';
import { baselineAddr } from './generateEvents';
import * as repo from './repository';
import {
  EMPTY_FILTERS,
  baselineKey,
  type Filters,
  type SpendBaseline,
} from './selectors';
import { useSession } from './session';
import type { FeedbackResponse, SourcingEvent } from './types';

interface ConsoleState {
  events: SourcingEvent[];
  loading: boolean;
  error: string | null;
  filters: Filters;
  baseline: SpendBaseline;
  baselineLoading: boolean;
  feedbackResponses: FeedbackResponse[];
  feedbackLoading: boolean;

  setFilters: (patch: Partial<Filters>) => void;
  toggleFy: (fy: FY) => void;
  toggleCategory: (category: string) => void;
  toggleSubcategory: (subcategory: string) => void;
  toggleRegion: (r: Region) => void;
  toggleType: (t: Filters['types'][number]) => void;
  clearFilters: () => void;

  refreshEvents: () => Promise<void>;
  addEvent: (e: SourcingEvent) => Promise<void>;
  removeEvent: (id: string) => Promise<void>;
  updateEventStatus: (id: string, status: Status) => Promise<void>;
  requestEventFeedback: (id: string) => Promise<void>;
  refreshFeedbackResponses: () => Promise<void>;
  submitFeedbackResponse: (input: {
    eventId: string;
    toolScore: number;
    supportScore: number;
    comment?: string;
  }) => Promise<{ error: string | null }>;

  refreshBaseline: () => Promise<void>;
  setBaselineCell: (fy: FY, cat: string, region: Region, value: number) => Promise<void>;
  prefillBaseline: () => Promise<void>;
  clearBaseline: () => Promise<void>;
}

export const useStore = create<ConsoleState>((set, get) => ({
  events: [],
  loading: true,
  error: null,
  filters: EMPTY_FILTERS,
  baseline: {},
  baselineLoading: true,
  feedbackResponses: [],
  feedbackLoading: true,

  setFilters: (patch) =>
    set((s) => ({ filters: { ...s.filters, ...patch } })),

  toggleFy: (fy) =>
    set((s) => {
      const has = s.filters.fys.includes(fy);
      return {
        filters: {
          ...s.filters,
          fys: has ? s.filters.fys.filter((x) => x !== fy) : [...s.filters.fys, fy],
        },
      };
    }),

  toggleCategory: (category) =>
    set((s) => {
      const has = s.filters.categories.includes(category);
      const categories = has
        ? s.filters.categories.filter((x) => x !== category)
        : [...s.filters.categories, category];
      const allowedSubs = new Set(
        categories.flatMap((cat) => CATEGORY_BY_NAME[cat]?.subcategories ?? []),
      );
      return {
        filters: {
          ...s.filters,
          categories,
          subcategories: categories.length
            ? s.filters.subcategories.filter((sub) => allowedSubs.has(sub))
            : [],
        },
      };
    }),

  toggleSubcategory: (subcategory) =>
    set((s) => {
      const has = s.filters.subcategories.includes(subcategory);
      return {
        filters: {
          ...s.filters,
          subcategories: has
            ? s.filters.subcategories.filter((x) => x !== subcategory)
            : [...s.filters.subcategories, subcategory],
        },
      };
    }),

  toggleRegion: (r) =>
    set((s) => {
      const has = s.filters.regions.includes(r);
      return {
        filters: {
          ...s.filters,
          regions: has ? s.filters.regions.filter((x) => x !== r) : [...s.filters.regions, r],
        },
      };
    }),

  toggleType: (t) =>
    set((s) => {
      const has = s.filters.types.includes(t);
      return {
        filters: {
          ...s.filters,
          types: has ? s.filters.types.filter((x) => x !== t) : [...s.filters.types, t],
        },
      };
    }),

  clearFilters: () => set({ filters: EMPTY_FILTERS }),

  refreshEvents: async () => {
    set({ loading: true, error: null });
    try {
      const events = await repo.listEvents();
      set({ events, loading: false });
    } catch (err) {
      console.error('[store] refreshEvents failed', err);
      set({ loading: false, error: (err as Error).message });
    }
  },

  addEvent: async (e) => {
    const requestorId = useSession.getState().user?.id ?? null;
    // Optimistic: prepend locally so the UI updates instantly.
    set((s) => ({ events: [e, ...s.events] }));
    try {
      await repo.insertEvent(e, requestorId);
    } catch (err) {
      console.error('[store] insertEvent failed; reverting', err);
      set((s) => ({
        events: s.events.filter((x) => x.id !== e.id),
        error: (err as Error).message,
      }));
    }
  },

  removeEvent: async (id) => {
    const prev = get().events;
    set({ events: prev.filter((e) => e.id !== id) });
    try {
      await repo.deleteEvent(id);
    } catch (err) {
      console.error('[store] deleteEvent failed; reverting', err);
      set({ events: prev, error: (err as Error).message });
    }
  },

  updateEventStatus: async (id, status) => {
    const prev = get().events;
    set({ events: prev.map((e) => (e.id === id ? { ...e, status } : e)) });
    try {
      await repo.updateEventStatus(id, status);
    } catch (err) {
      console.error('[store] updateEventStatus failed; reverting', err);
      set({ events: prev, error: (err as Error).message });
    }
  },

  requestEventFeedback: async (id) => {
    const prev = get().events;
    set({ events: prev.map((e) => (e.id === id ? { ...e, feedbackRequested: true } : e)) });
    try {
      await repo.markFeedbackRequested(id);
    } catch (err) {
      console.error('[store] markFeedbackRequested failed; reverting', err);
      set({ events: prev, error: (err as Error).message });
    }
  },

  refreshFeedbackResponses: async () => {
    set({ feedbackLoading: true });
    try {
      const feedbackResponses = await repo.listFeedbackResponses();
      set({ feedbackResponses, feedbackLoading: false });
    } catch (err) {
      console.error('[store] refreshFeedbackResponses failed', err);
      set({ feedbackLoading: false, error: (err as Error).message });
    }
  },

  submitFeedbackResponse: async ({ eventId, toolScore, supportScore, comment }) => {
    const user = useSession.getState().user;
    if (!user) return { error: 'Sign in before submitting feedback.' };

    try {
      const response = await repo.upsertFeedbackResponse({
        eventId,
        requestorId: user.id,
        requestorEmail: user.email,
        toolScore,
        supportScore,
        comment: comment?.trim() || undefined,
      });
      set((s) => ({
        feedbackResponses: [
          response,
          ...s.feedbackResponses.filter((x) => x.id !== response.id),
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
      const baseline = await repo.listBaseline();
      set({ baseline, baselineLoading: false });
    } catch (err) {
      console.error('[store] refreshBaseline failed', err);
      set({ baselineLoading: false, error: (err as Error).message });
    }
  },

  setBaselineCell: async (fy, cat, region, value) => {
    const prev = get().baseline;
    const key = baselineKey(fy, cat, region);
    const next = { ...prev };
    if (!value || value <= 0) delete next[key];
    else next[key] = value;
    set({ baseline: next });

    try {
      if (!value || value <= 0) await repo.deleteBaselineCell(fy, cat, region);
      else await repo.upsertBaselineCell(fy, cat, region, value);
    } catch (err) {
      console.error('[store] setBaselineCell failed; reverting', err);
      set({ baseline: prev, error: (err as Error).message });
    }
  },

  prefillBaseline: async () => {
    const prev = get().baseline;
    const next: SpendBaseline = {};
    const rows: Array<{ fy: FY; category: string; region: Region; value: number }> = [];

    for (const fy of FYS) {
      for (const cat of CATEGORIES) {
        for (const region of REGIONS as Region[]) {
          const value = Math.round(baselineAddr(fy, cat, region));
          next[baselineKey(fy, cat.name, region)] = value;
          rows.push({ fy, category: cat.name, region, value });
        }
      }
    }

    set({ baseline: next });
    try {
      await repo.bulkUpsertBaseline(rows);
    } catch (err) {
      console.error('[store] prefillBaseline failed; reverting', err);
      set({ baseline: prev, error: (err as Error).message });
    }
  },

  clearBaseline: async () => {
    const prev = get().baseline;
    set({ baseline: {} });
    try {
      await repo.clearBaseline();
    } catch (err) {
      console.error('[store] clearBaseline failed; reverting', err);
      set({ baseline: prev, error: (err as Error).message });
    }
  },
}));

// ---- Auto-fetch on login, clear on logout ----------------------------------
// Subscribe in module scope so it fires once for the whole app lifetime.
useSession.subscribe((state, prev) => {
  const justLoggedIn = state.user && !prev.user;
  const justLoggedOut = !state.user && prev.user;
  if (justLoggedIn) {
    void useStore.getState().refreshEvents();
    void useStore.getState().refreshBaseline();
    void useStore.getState().refreshFeedbackResponses();
  } else if (justLoggedOut) {
    useStore.setState({
      events: [],
      loading: true,
      error: null,
      baseline: {},
      baselineLoading: true,
      feedbackResponses: [],
      feedbackLoading: true,
    });
  }
});
