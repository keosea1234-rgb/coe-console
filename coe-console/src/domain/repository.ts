import { supabase } from '../lib/supabase';
import type { FY, Region, Status } from './constants';
import type { Database } from './database.types';
import { baselineKey, type SpendBaseline } from './selectors';
import type { FeedbackResponse, SourcingEvent } from './types';

type SourcingEventRow = Database['public']['Tables']['sourcing_events']['Row'];
type SourcingEventInsert = Database['public']['Tables']['sourcing_events']['Insert'];
type SpendBaselineRow = Database['public']['Tables']['spend_baseline']['Row'];
type FeedbackResponseRow = Database['public']['Tables']['feedback_responses']['Row'];
type FeedbackResponseInsert = Database['public']['Tables']['feedback_responses']['Insert'];
type LegacySourcingEventRow = Omit<SourcingEventRow, 'status'> & {
  status: SourcingEventRow['status'] | 'Awarded';
};

// Postgres numeric comes back as string; coerce defensively.
const num = (v: number | string) => (typeof v === 'string' ? Number(v) : v);

// undefined → null for fields that are nullable in DB.
const opt = <T>(v: T | undefined): T | null => (v === undefined ? null : v);
const normalizeStatus = (status: LegacySourcingEventRow['status']): Status =>
  status === 'Awarded' ? 'Completed' : status;

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

// ---- CRUD ------------------------------------------------------------------
export async function listEvents(): Promise<SourcingEvent[]> {
  const { data, error } = await supabase
    .from('sourcing_events')
    .select('*')
    .order('start_date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToEvent);
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
