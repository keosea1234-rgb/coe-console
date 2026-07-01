import { CATEGORY_BY_NAME } from './categories';
import type { EventType, FY, Region, Status } from './constants';
import { isValidEmail } from './eventFormHelpers';
import type { SourcingEvent } from './types';

export type FyOverride = 'auto' | FY;
export type GroupMode = 'single' | 'multiple';
export type Directness = 'Direct' | 'Indirect';

export interface RequestGroupRow {
  region: Region;
  spend: number;
}

export interface RequestEventInput {
  eventDate: string;
  status: Status;
  resolvedFy: FY;
  eventId: string;
  eventTypes: EventType[];
  requestorEmail: string;
  groupMode: GroupMode;
  groupRows: RequestGroupRow[];
  directness: Directness;
  category: string;
  subcategory: string;
  shouldCostModeling: boolean;
  riskAssessment: boolean;
  esgAssessment: boolean;
}

export type RequestValidationErrors = Record<string, string>;

export function activeSpendRows(input: Pick<RequestEventInput, 'groupMode' | 'groupRows'>): RequestGroupRow[] {
  const activeRows = input.groupMode === 'single' ? input.groupRows.slice(0, 1) : input.groupRows;
  return activeRows.filter((row) => row.spend > 0);
}

export function validateRequestEventInput(
  input: RequestEventInput,
  existingEvents: SourcingEvent[],
): RequestValidationErrors {
  const errors: RequestValidationErrors = {};

  if (!input.eventDate) errors.eventDate = 'Event date is required.';
  if (input.eventTypes.length === 0) errors.eventType = 'Select at least one event type.';

  const requestorEmail = input.requestorEmail.trim();
  if (!requestorEmail) {
    errors.requestorEmail = 'Requestor email is required.';
  } else if (!isValidEmail(requestorEmail)) {
    errors.requestorEmail = 'Enter a valid email address.';
  }

  if (!input.category) {
    errors.category = 'Category is required.';
  } else if (!CATEGORY_BY_NAME[input.category]) {
    errors.category = 'Choose a valid category.';
  }

  if (!input.subcategory) {
    errors.subcategory = 'Subcategory is required.';
  } else if (
    input.category &&
    CATEGORY_BY_NAME[input.category] &&
    !CATEGORY_BY_NAME[input.category].subcategories.includes(input.subcategory)
  ) {
    errors.subcategory = 'Choose a valid subcategory for the selected category.';
  }

  const withSpend = activeSpendRows(input);
  if (withSpend.length === 0) {
    errors.spend = 'Enter spend greater than zero for at least one business group.';
  }

  const duplicateRegion = withSpend.find((row, index) =>
    withSpend.some((other, otherIndex) => otherIndex !== index && other.region === row.region),
  );
  if (duplicateRegion) {
    errors.spend = `${duplicateRegion.region} is entered more than once. Use one row per business group.`;
  }

  const eventId = input.eventId.trim();
  if (!eventId) errors.eventId = 'Event ID is required.';
  if (eventId && existingEvents.some((event) => event.id === eventId)) {
    errors.eventId = 'Event ID already exists. Use a new ID or fiscal year.';
  }

  return errors;
}

export function buildRequestEvent(input: RequestEventInput, createdAt: string): SourcingEvent {
  const rows = activeSpendRows(input);
  if (!rows[0]) throw new Error('Cannot build sourcing event without spend.');

  const totalSpend = rows.reduce((sum, row) => sum + row.spend, 0);
  const regions = rows.map((row) => row.region);
  const businessGroups = rows.map((row) => ({
    region: row.region,
    addressable: Math.round(row.spend),
    sourced: 0,
  }));

  return {
    id: input.eventId.trim(),
    name: `${input.category} - ${input.subcategory}`,
    fy: input.resolvedFy,
    category: input.category,
    subcategory: input.subcategory,
    region: rows[0].region,
    regions,
    businessGroups,
    type: input.eventTypes[0],
    eventTypes: input.eventTypes,
    status: input.status,
    addressable: Math.round(totalSpend),
    sourced: 0,
    savings: 0,
    startDate: input.eventDate,
    requestor: input.requestorEmail.trim(),
    shouldCostModeling: input.shouldCostModeling,
    riskAssessment: input.riskAssessment,
    esgAssessment: input.esgAssessment,
    directness: input.directness,
    requestCreatedAt: createdAt,
  };
}
