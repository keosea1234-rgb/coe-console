import type { FY, Region, EventType, Status } from './constants';

// Per-region spend breakdown inside a multi-region event.
export interface BusinessGroup {
  region: Region;
  addressable: number;
  sourced: number;
}

// A single sourcing event — the atomic record both screens share.
export interface SourcingEvent {
  id: string;
  name: string;
  fy: FY;
  category: string; // category name
  subcategory: string;
  region: Region; // primary / first region (kept for generated-event compat)
  regions?: Region[]; // all regions this event covers (undefined = single-region generated event)
  businessGroups?: BusinessGroup[]; // per-region spend (undefined = single-region generated event)
  type: EventType;
  eventTypes?: EventType[];
  status: Status;
  addressable: number; // $ total addressable spend across all groups
  sourced: number; // $ total sourced across all groups
  savings: number; // $ realized savings (0 unless Completed)
  startDate: string; // ISO date
  requestor?: string;
  shouldCostModeling?: boolean;
  riskAssessment?: boolean;
  esgAssessment?: boolean;
  directness?: 'Direct' | 'Indirect';
  feedbackRequested?: boolean;
  requestCreatedAt?: string;
}

export interface FeedbackResponse {
  id: string;
  eventId: string;
  requestorId: string;
  requestorEmail: string;
  toolScore: number;
  supportScore: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}
