import type { Status } from '../../../domain/constants';

export type RequestInboxFilter = 'active' | 'new' | 'archived' | 'all';

export type RequestInboxActionKind =
  | 'approve'
  | 'reject'
  | 'request-feedback'
  | 'restore'
  | 'update-status';

export interface RequestInboxActionState {
  eventId: string;
  kind: RequestInboxActionKind;
}

export interface RequestInboxActionOptions {
  eventId: string;
  kind: RequestInboxActionKind;
  action: () => Promise<void>;
  setActionState: (state: RequestInboxActionState | null) => void;
  setActionError: (message: string | null) => void;
  safeError: string;
  clearError?: () => void;
  getStoreError?: () => string | null;
}

export interface RequestStatusUpdate {
  eventId: string;
  status: Status;
}
