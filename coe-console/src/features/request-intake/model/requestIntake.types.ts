import type { EventType, Status } from '../../../domain/constants';
import type {
  Directness,
  FyOverride,
  GroupMode,
  RequestGroupRow,
} from '../../../domain/requestIntake';

export interface BusinessGroupRow extends RequestGroupRow {
  key: string;
}

export type DocType =
  | 'Bid Template'
  | 'RFI Questionnaire'
  | 'Supplier List'
  | 'Specification'
  | 'Other';

export interface AttachmentRow {
  key: string;
  docType: DocType;
  file: File;
  error?: string;
}

export type UploadStatus = 'idle' | 'uploading' | 'partial-failure';

export interface UploadProgress {
  done: number;
  total: number;
}

export interface UploadFailure {
  name: string;
  message: string;
}

export interface RequestDraftFields {
  eventDate: string;
  status: Status;
  statusTouched: boolean;
  fyOverride: FyOverride;
  eventId: string;
  eventIdTouched: boolean;
  eventTypes: EventType[];
  requestorEmail: string;
  groupMode: GroupMode;
  groupRows: BusinessGroupRow[];
  directness: Directness;
  category: string;
  subcategory: string;
  shouldCostModeling: boolean;
  riskAssessment: boolean;
  esgAssessment: boolean;
  docType: DocType;
}

export interface RequestDraft extends RequestDraftFields {
  savedAt: string;
}

export const DOC_TYPES: DocType[] = [
  'Bid Template',
  'RFI Questionnaire',
  'Supplier List',
  'Specification',
  'Other',
];

export const REQUEST_DRAFT_KEY = 'coe-console:new-event-request:draft';

let requestRowKey = 0;

export function nextRequestRowKey() {
  return `row-${++requestRowKey}`;
}

export function createDefaultGroupRows(): BusinessGroupRow[] {
  return [
    { key: nextRequestRowKey(), region: 'NA', spend: 0 },
    { key: nextRequestRowKey(), region: 'EMEA', spend: 0 },
    { key: nextRequestRowKey(), region: 'APAC', spend: 0 },
  ];
}
