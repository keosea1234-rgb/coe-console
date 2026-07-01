import type { SourcingEvent } from '../../domain/types';
import { RequestInboxFeature } from '../../features/request-inbox/RequestInboxFeature';

export function RequestInbox({ events }: { events: SourcingEvent[] }) {
  return <RequestInboxFeature events={events} />;
}
