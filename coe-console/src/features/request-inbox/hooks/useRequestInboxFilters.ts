import { useMemo, useState } from 'react';
import type { SourcingEvent } from '../../../domain/types';
import type { RequestInboxFilter } from '../model/requestInbox.types';

export function formatReceivedAt(iso: string | undefined): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function requestInboxRequests(events: SourcingEvent[]): SourcingEvent[] {
  return events
    .filter((event) => !!event.requestCreatedAt)
    .sort((a, b) => (b.requestCreatedAt ?? '').localeCompare(a.requestCreatedAt ?? ''));
}

export function filterRequestInboxRequests(
  requests: SourcingEvent[],
  filter: RequestInboxFilter,
): SourcingEvent[] {
  if (filter === 'new') {
    return requests.filter((event) => !event.archivedAt && (event.status === 'Planned' || event.status === 'Live'));
  }
  if (filter === 'archived') return requests.filter((event) => !!event.archivedAt);
  if (filter === 'all') return requests;
  return requests.filter((event) => !event.archivedAt);
}

export function isFreshRequest(event: SourcingEvent, now = Date.now()): boolean {
  return !!(
    event.requestCreatedAt &&
    !event.archivedAt &&
    now - new Date(event.requestCreatedAt).getTime() < 24 * 60 * 60 * 1000
  );
}

export function summarizeRequestInboxRequests(requests: SourcingEvent[], visible: SourcingEvent[]) {
  const activeCount = requests.filter((event) => !event.archivedAt).length;
  return {
    totalSpend: visible.reduce((sum, event) => sum + (event.addressable || 0), 0),
    activeCount,
    archivedCount: requests.length - activeCount,
  };
}

export function useRequestInboxFilters(events: SourcingEvent[]) {
  const [filter, setFilter] = useState<RequestInboxFilter>('active');
  const requests = useMemo(() => requestInboxRequests(events), [events]);
  const visible = useMemo(() => filterRequestInboxRequests(requests, filter), [requests, filter]);
  const summary = useMemo(() => summarizeRequestInboxRequests(requests, visible), [requests, visible]);

  return {
    filter,
    setFilter,
    requests,
    visible,
    ...summary,
  };
}
