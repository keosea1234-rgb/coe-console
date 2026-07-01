import { Button, StatusBadge } from '../../../components/common/primitives';
import { STATUSES, type Status } from '../../../domain/constants';
import type { FeedbackResponse, SourcingEvent } from '../../../domain/types';
import { canEmailFeedback } from '../../../lib/feedbackEmail';
import { theme } from '../../../styles/theme';

export function RequestStatusControl({
  event,
  busy,
  onStatusChange,
}: {
  event: SourcingEvent;
  busy: boolean;
  onStatusChange: (eventId: string, status: Status) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <StatusBadge status={event.status} />
      <select
        className="ui-select"
        aria-label={`Change status for ${event.name}`}
        value={event.status}
        disabled={busy}
        onChange={(selectEvent) => onStatusChange(event.id, selectEvent.target.value as Status)}
        style={{
          width: 124,
          height: 30,
          fontSize: 11.5,
          fontWeight: 700,
          paddingLeft: 9,
          cursor: busy ? 'wait' : undefined,
        }}
      >
        {STATUSES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
    </div>
  );
}

export function RequestFeedbackAction({
  event,
  response,
  busy,
  onRequest,
}: {
  event: SourcingEvent;
  response?: FeedbackResponse;
  busy: boolean;
  onRequest: () => void;
}) {
  if (response) {
    const average = ((response.toolScore + response.supportScore) / 2).toFixed(1);
    return (
      <div style={{ display: 'grid', gap: 4, minWidth: 170 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              fontFamily: theme.mono,
              padding: '2px 6px',
              borderRadius: 4,
              background: theme.successBg,
              color: theme.success,
            }}
          >
            NPS {average}
          </span>
          <span style={{ fontSize: 11, color: theme.textTertiary, fontFamily: theme.mono }}>
            Tool {response.toolScore} / Support {response.supportScore}
          </span>
        </div>
        {response.comment && (
          <span style={{ fontSize: 11.5, color: theme.textSecondary, whiteSpace: 'normal' }}>
            {response.comment}
          </span>
        )}
      </div>
    );
  }

  return (
    <Button
      variant="secondary"
      disabled={busy || !canEmailFeedback(event)}
      onClick={onRequest}
      style={{
        height: 28,
        padding: '6px 10px',
        fontSize: 11.5,
        color: !canEmailFeedback(event) ? theme.textTertiary : theme.textSecondary,
        cursor: busy ? 'wait' : undefined,
      }}
    >
      {busy ? 'Requesting...' : event.feedbackRequested ? 'Request again' : 'Request feedback'}
    </Button>
  );
}

export function RequestActionMenu({
  event,
  busy,
  onRejectArchive,
  onRestore,
}: {
  event: SourcingEvent;
  busy: boolean;
  onRejectArchive: (eventId: string) => void;
  onRestore: (eventId: string) => void;
}) {
  if (event.archivedAt) {
    return (
      <Button
        variant="ghost"
        disabled={busy}
        onClick={() => onRestore(event.id)}
        style={{ height: 28, padding: '6px 9px', fontSize: 11.5, color: theme.textSecondary }}
      >
        {busy ? 'Restoring...' : 'Restore'}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      disabled={busy}
      onClick={() => {
        const ok = window.confirm(
          `Archive ${event.id}? It will leave the active inbox but remain available for audit.`,
        );
        if (ok) onRejectArchive(event.id);
      }}
      style={{ height: 28, padding: '6px 9px', fontSize: 11.5, color: theme.textSecondary }}
    >
      {busy ? 'Archiving...' : 'Archive'}
    </Button>
  );
}
