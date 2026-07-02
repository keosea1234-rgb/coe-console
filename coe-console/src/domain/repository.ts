import { supabase } from '../lib/supabase';
import { isEnvFlagEnabled } from '../lib/env';
import { REGIONS, STATUSES, type FY, type Region, type Status } from './constants';
import type { Database } from './database.types';
import { generateEvents } from './generateEvents';
import { baselineKey, type DashboardSummary, type SpendBaseline } from './selectors';
import type { FeedbackResponse, RequestUpdate, SourcingEvent } from './types';

type SourcingEventRow = Database['public']['Tables']['sourcing_events']['Row'];
type SourcingEventInsert = Database['public']['Tables']['sourcing_events']['Insert'];
type SpendBaselineRow = Database['public']['Tables']['spend_baseline']['Row'];
type FeedbackResponseRow = Database['public']['Tables']['feedback_responses']['Row'];
type FeedbackResponseInsert = Database['public']['Tables']['feedback_responses']['Insert'];
type RequestUpdateRow = Database['public']['Tables']['request_updates']['Row'];
type RequestUpdateInsert = Database['public']['Tables']['request_updates']['Insert'];
type ClientErrorRow = Database['public']['Tables']['client_errors']['Row'];
type DashboardSummaryFunction = Database['public']['Functions']['dashboard_summary'];
type LegacySourcingEventRow = Omit<SourcingEventRow, 'status'> & {
  status: SourcingEventRow['status'] | 'Awarded';
};

// Postgres numeric comes back as string; coerce defensively.
const num = (v: unknown): number => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string' || typeof v === 'bigint') return Number(v);
  return 0;
};

// undefined → null for fields that are nullable in DB.
const opt = <T>(v: T | undefined): T | null => (v === undefined ? null : v);
const normalizeStatus = (status: LegacySourcingEventRow['status']): Status =>
  status === 'Awarded' ? 'Completed' : status;
export const isDemoModeEnabled = () => isEnvFlagEnabled('VITE_DEMO_MODE');

export function eventsOrDemoFallback(events: SourcingEvent[]): SourcingEvent[] {
  return events.length || !isDemoModeEnabled() ? events : generateEvents();
}

export interface DashboardSummaryRpcRow {
  total_addressable: number | string | null;
  total_sourced: number | string | null;
  total_savings: number | string | null;
  total_events: number | string | bigint | null;
  live_events: number | string | bigint | null;
  completed_events: number | string | bigint | null;
  status_counts: unknown;
  category_counts: unknown;
  region_counts: unknown;
}

export interface ClientErrorLogEntry {
  id: string;
  source: ClientErrorRow['source'];
  message: string;
  stack?: string;
  componentStack?: string;
  route?: string;
  userAgent?: string;
  appVersion?: string;
  actorId?: string;
  reportedAt: string;
}

export function rowToEvent(r: LegacySourcingEventRow): SourcingEvent {
  return {
    id: r.id,
    name: r.name,
    fy: r.fy,
    category: r.category,
    subcategory: r.subcategory,
    region: r.region,
    regions: r.regions ?? undefined,
    businessGroups: r.business_groups ?? undefined,
    type: r.type,
    eventTypes: r.event_types ?? undefined,
    status: normalizeStatus(r.status),
    addressable: num(r.addressable),
    sourced: num(r.sourced),
    savings: num(r.savings),
    startDate: r.start_date,
    requestor: r.requestor ?? undefined,
    requestorId: r.requestor_id ?? undefined,
    shouldCostModeling: r.should_cost_modeling ?? undefined,
    riskAssessment: r.risk_assessment ?? undefined,
    esgAssessment: r.esg_assessment ?? undefined,
    directness: r.directness ?? undefined,
    feedbackRequested: r.feedback_requested || undefined,
    requestCreatedAt: r.request_created_at ?? undefined,
    archivedAt: r.archived_at ?? undefined,
    archivedBy: r.archived_by ?? undefined,
  };
}

export function eventToInsert(e: SourcingEvent, requestorId: string | null): SourcingEventInsert {
  return {
    id: e.id,
    name: e.name,
    fy: e.fy,
    category: e.category,
    subcategory: e.subcategory,
    region: e.region,
    regions: opt(e.regions),
    business_groups: opt(e.businessGroups),
    type: e.type,
    event_types: opt(e.eventTypes),
    status: e.status,
    addressable: e.addressable,
    sourced: e.sourced,
    savings: e.savings,
    start_date: e.startDate,
    requestor: opt(e.requestor),
    requestor_id: requestorId,
    should_cost_modeling: opt(e.shouldCostModeling),
    risk_assessment: opt(e.riskAssessment),
    esg_assessment: opt(e.esgAssessment),
    directness: opt(e.directness),
    feedback_requested: e.feedbackRequested ?? false,
    request_created_at: opt(e.requestCreatedAt),
  };
}

function rowToFeedbackResponse(r: FeedbackResponseRow): FeedbackResponse {
  return {
    id: r.id,
    eventId: r.event_id,
    requestorId: r.requestor_id,
    requestorEmail: r.requestor_email,
    toolScore: r.tool_score,
    supportScore: r.support_score,
    comment: r.comment ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function rowToRequestUpdate(r: RequestUpdateRow): RequestUpdate {
  return {
    id: r.id,
    eventId: r.event_id,
    authorId: r.author_id,
    authorEmail: r.author_email,
    authorRole: r.author_role,
    body: r.body,
    createdAt: r.created_at,
  };
}

function rowToClientError(r: ClientErrorRow): ClientErrorLogEntry {
  return {
    id: r.id,
    source: r.source,
    message: r.message,
    stack: r.stack ?? undefined,
    componentStack: r.component_stack ?? undefined,
    route: r.route ?? undefined,
    userAgent: r.user_agent ?? undefined,
    appVersion: r.app_version ?? undefined,
    actorId: r.actor_id ?? undefined,
    reportedAt: r.reported_at,
  };
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function isStatus(value: unknown): value is Status {
  return typeof value === 'string' && STATUSES.includes(value as Status);
}

function isRegion(value: unknown): value is Region {
  return typeof value === 'string' && REGIONS.includes(value as Region);
}

function mapStatusBuckets(value: unknown): DashboardSummary['statusBuckets'] {
  const buckets = new Map<Status, DashboardSummary['statusBuckets'][number]>(
    STATUSES.map((status) => [status, { status, count: 0, sourced: 0 }] as const),
  );

  for (const item of asArray(value)) {
    const record = asRecord(item);
    if (!record || !isStatus(record.status)) continue;
    buckets.set(record.status, {
      status: record.status,
      count: num(record.count ?? record.event_count),
      sourced: num(record.sourced),
    });
  }

  return STATUSES.map((status) => buckets.get(status)!);
}

function mapCategoryCounts(value: unknown): DashboardSummary['categoryCounts'] {
  return asArray(value)
    .map((item) => {
      const record = asRecord(item);
      if (!record || typeof record.category !== 'string') return null;
      return {
        category: record.category,
        count: num(record.count ?? record.event_count),
        sourced: num(record.sourced),
      };
    })
    .filter((item): item is DashboardSummary['categoryCounts'][number] => item !== null);
}

function mapRegionCounts(value: unknown): DashboardSummary['regionCounts'] {
  return asArray(value)
    .map((item) => {
      const record = asRecord(item);
      if (!record || !isRegion(record.region)) return null;
      return {
        region: record.region,
        count: num(record.count ?? record.event_count),
        sourced: num(record.sourced),
      };
    })
    .filter((item): item is DashboardSummary['regionCounts'][number] => item !== null);
}

export function mapDashboardSummaryRow(row: DashboardSummaryRpcRow): DashboardSummary {
  const sourced = num(row.total_sourced);
  const savings = num(row.total_savings);
  const addressable = num(row.total_addressable);

  return {
    totals: {
      events: num(row.total_events),
      live: num(row.live_events),
      done: num(row.completed_events),
      addressable,
      sourced,
      savings,
      coverage: addressable > 0 ? Math.min(1, sourced / addressable) : 0,
      savingsRate: sourced > 0 ? savings / sourced : 0,
    },
    statusBuckets: mapStatusBuckets(row.status_counts),
    categoryCounts: mapCategoryCounts(row.category_counts),
    regionCounts: mapRegionCounts(row.region_counts),
  };
}

const emptyToNull = <T>(values: T[]): T[] | null => (values.length ? values : null);

// ---- CRUD ------------------------------------------------------------------
export async function listEvents(): Promise<SourcingEvent[]> {
  const { data, error } = await supabase
    .from('sourcing_events')
    .select('*')
    .order('start_date', { ascending: false });
  if (error) throw error;
  const events = (data ?? []).map(rowToEvent);
  return eventsOrDemoFallback(events);
}

export async function listDashboardSummary(filters: {
  fys: FY[];
  regions: Region[];
  categories: string[];
  subcategories: string[];
  types: DashboardSummaryFunction['Args']['filter_types'];
}): Promise<DashboardSummary> {
  const { data, error } = await supabase
    .rpc('dashboard_summary', {
      filter_fys: emptyToNull(filters.fys),
      filter_statuses: null,
      filter_categories: emptyToNull(filters.categories),
      filter_regions: emptyToNull(filters.regions),
      filter_subcategories: emptyToNull(filters.subcategories),
      filter_types: filters.types && filters.types.length ? filters.types : null,
      filter_requestor_id: null,
      filter_created_from: null,
      filter_created_to: null,
    })
    .single();

  if (error) throw error;
  return mapDashboardSummaryRow(data as DashboardSummaryRpcRow);
}

export async function insertEvent(e: SourcingEvent, requestorId: string | null) {
  const { error } = await supabase
    .from('sourcing_events')
    .insert(eventToInsert(e, requestorId));
  if (error) throw error;
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from('sourcing_events').delete().eq('id', id);
  if (error) throw error;
}

export async function archiveEvent(id: string, actorId: string, archivedAt = new Date().toISOString()) {
  const { error } = await supabase
    .from('sourcing_events')
    .update({ archived_at: archivedAt, archived_by: actorId })
    .eq('id', id);
  if (error) throw error;
}

export async function unarchiveEvent(id: string) {
  const { error } = await supabase
    .from('sourcing_events')
    .update({ archived_at: null, archived_by: null })
    .eq('id', id);
  if (error) throw error;
}

export async function updateEventStatus(id: string, status: Status) {
  const { error } = await supabase
    .from('sourcing_events')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}

export async function markFeedbackRequested(id: string) {
  const { error } = await supabase
    .from('sourcing_events')
    .update({ feedback_requested: true })
    .eq('id', id);
  if (error) throw error;
}

export async function listBaseline(): Promise<SpendBaseline> {
  const { data, error } = await supabase
    .from('spend_baseline')
    .select('fy, category, region, value');
  if (error) throw error;

  const baseline: SpendBaseline = {};
  for (const row of (data ?? []) as SpendBaselineRow[]) {
    baseline[baselineKey(row.fy, row.category, row.region)] = num(row.value);
  }
  return baseline;
}

export async function upsertBaselineCell(
  fy: FY,
  category: string,
  region: Region,
  value: number,
) {
  const { error } = await supabase
    .from('spend_baseline')
    .upsert({ fy, category, region, value }, { onConflict: 'fy,category,region' });
  if (error) throw error;
}

export async function deleteBaselineCell(fy: FY, category: string, region: Region) {
  const { error } = await supabase
    .from('spend_baseline')
    .delete()
    .eq('fy', fy)
    .eq('category', category)
    .eq('region', region);
  if (error) throw error;
}

export async function bulkUpsertBaseline(
  rows: Array<{ fy: FY; category: string; region: Region; value: number }>,
) {
  const { error } = await supabase
    .from('spend_baseline')
    .upsert(rows, { onConflict: 'fy,category,region' });
  if (error) throw error;
}

export async function clearBaseline() {
  const { error } = await supabase
    .from('spend_baseline')
    .delete()
    .not('fy', 'is', null);
  if (error) throw error;
}

export async function listFeedbackResponses(): Promise<FeedbackResponse[]> {
  const { data, error } = await supabase
    .from('feedback_responses')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as FeedbackResponseRow[]).map(rowToFeedbackResponse);
}

export async function upsertFeedbackResponse(input: {
  eventId: string;
  requestorId: string;
  requestorEmail: string;
  toolScore: number;
  supportScore: number;
  comment?: string;
}): Promise<FeedbackResponse> {
  const row: FeedbackResponseInsert = {
    event_id: input.eventId,
    requestor_id: input.requestorId,
    requestor_email: input.requestorEmail,
    tool_score: input.toolScore,
    support_score: input.supportScore,
    comment: opt(input.comment),
  };
  const { data, error } = await supabase
    .from('feedback_responses')
    .upsert(row, { onConflict: 'event_id,requestor_id' })
    .select('*')
    .single();
  if (error) throw error;
  return rowToFeedbackResponse(data as FeedbackResponseRow);
}

export async function listRequestUpdates(): Promise<RequestUpdate[]> {
  const { data, error } = await supabase
    .from('request_updates')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as RequestUpdateRow[]).map(rowToRequestUpdate);
}

export async function listClientErrors(limit = 100): Promise<ClientErrorLogEntry[]> {
  const { data, error } = await supabase
    .from('client_errors')
    .select('id, source, message, stack, component_stack, route, user_agent, app_version, actor_id, reported_at')
    .order('reported_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as ClientErrorRow[]).map(rowToClientError);
}

export async function insertRequestUpdate(input: {
  eventId: string;
  authorId: string;
  authorEmail: string;
  authorRole: 'user' | 'admin';
  body: string;
}): Promise<RequestUpdate> {
  const row: RequestUpdateInsert = {
    event_id: input.eventId,
    author_id: input.authorId,
    author_email: input.authorEmail,
    author_role: input.authorRole,
    body: input.body,
  };
  const { data, error } = await supabase.from('request_updates').insert(row).select('*').single();
  if (error) throw error;
  return rowToRequestUpdate(data as RequestUpdateRow);
}
