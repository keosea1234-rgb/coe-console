import type { StateCreator } from 'zustand';
import type { FY, Region, Status } from './constants';
import type { Filters, SpendBaseline } from './selectors';
import type { FeedbackResponse, SourcingEvent } from './types';

export interface ClientDataState {
  filters: Filters;
}

export interface ClientActions {
  setFilters: (patch: Partial<Filters>) => void;
  toggleFy: (fy: FY) => void;
  toggleCategory: (category: string) => void;
  toggleSubcategory: (subcategory: string) => void;
  toggleRegion: (region: Region) => void;
  toggleType: (type: Filters['types'][number]) => void;
  clearFilters: () => void;
}

export interface ServerDataState {
  events: SourcingEvent[];
  loading: boolean;
  error: string | null;
  baseline: SpendBaseline;
  baselineLoading: boolean;
  feedbackResponses: FeedbackResponse[];
  feedbackLoading: boolean;
}

export interface FeedbackInput {
  eventId: string;
  toolScore: number;
  supportScore: number;
  comment?: string;
}

export interface BaselineCellInput {
  fy: FY;
  category: string;
  region: Region;
  value: number;
}

export interface StoreUser {
  id: string;
  email: string;
}

export interface ConsoleRepository {
  listEvents: () => Promise<SourcingEvent[]>;
  insertEvent: (event: SourcingEvent, requestorId: string | null) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  archiveEvent: (id: string, actorId: string, archivedAt: string) => Promise<void>;
  unarchiveEvent: (id: string) => Promise<void>;
  updateEventStatus: (id: string, status: Status) => Promise<void>;
  markFeedbackRequested: (id: string) => Promise<void>;
  listFeedbackResponses: () => Promise<FeedbackResponse[]>;
  upsertFeedbackResponse: (
    input: FeedbackInput & { requestorId: string; requestorEmail: string },
  ) => Promise<FeedbackResponse>;
  listBaseline: () => Promise<SpendBaseline>;
  upsertBaselineCell: (fy: FY, category: string, region: Region, value: number) => Promise<void>;
  deleteBaselineCell: (fy: FY, category: string, region: Region) => Promise<void>;
  bulkUpsertBaseline: (rows: BaselineCellInput[]) => Promise<void>;
  clearBaseline: () => Promise<void>;
}

export interface ServerStateDeps {
  repository: ConsoleRepository;
  getCurrentUser: () => StoreUser | null;
  now: () => string;
}

export interface ServerActions {
  refreshEvents: () => Promise<void>;
  addEvent: (event: SourcingEvent) => Promise<void>;
  removeEvent: (id: string) => Promise<void>;
  archiveEvent: (id: string) => Promise<void>;
  unarchiveEvent: (id: string) => Promise<void>;
  clearError: () => void;
  updateEventStatus: (id: string, status: Status) => Promise<void>;
  requestEventFeedback: (id: string) => Promise<void>;
  refreshFeedbackResponses: () => Promise<void>;
  submitFeedbackResponse: (input: FeedbackInput) => Promise<{ error: string | null }>;
  refreshBaseline: () => Promise<void>;
  setBaselineCell: (fy: FY, category: string, region: Region, value: number) => Promise<void>;
  prefillBaseline: () => Promise<void>;
  clearBaseline: () => Promise<void>;
}

export type ClientState = ClientDataState & ClientActions;
export type ServerState = ServerDataState & ServerActions;
export type ConsoleState = ClientState & ServerState;

export type ConsoleSet = Parameters<StateCreator<ConsoleState>>[0];
export type ConsoleGet = Parameters<StateCreator<ConsoleState>>[1];
