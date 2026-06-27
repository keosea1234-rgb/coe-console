import { useMemo, useState } from 'react';
import { theme } from '../../styles/theme';
import { Card, CardTitle } from '../common/Card';
import type { FeedbackResponse, SourcingEvent } from '../../domain/types';
import { fmtUSD } from '../../domain/selectors';
import { STATUSES, type Status } from '../../domain/constants';
import { useStore } from '../../domain/store';
import { Button, StatusBadge } from '../common/primitives';
import { CATEGORY_BY_NAME } from '../../domain/categories';
import { canEmailFeedback, openFeedbackEmail } from '../../lib/feedbackEmail';

const th: React.CSSProperties = {
  textAlign: 'left',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '.06em',
  textTransform: 'uppercase',
  color: theme.textTertiary,
  fontFamily: theme.mono,
  padding: '9px 12px',
  position: 'sticky',
  top: 0,
  background: theme.surfaceRaised,
  borderBottom: `1px solid ${theme.border}`,
  zIndex: 1,
};
const td: React.CSSProperties = {
  fontSize: 12.5,
  padding: '10px 12px',
  borderBottom: `1px solid ${theme.border}`,
  whiteSpace: 'nowrap',
  color: theme.ink,
};
const num: React.CSSProperties = {
  ...td,
  fontFamily: theme.mono,
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
};

function fmtReceivedAt(iso: string | undefined): string {
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

function FeedbackCell({
  event,
  response,
  onRequest,
}: {
  event: SourcingEvent;
  response?: FeedbackResponse;
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
      disabled={!canEmailFeedback(event)}
      onClick={onRequest}
      style={{
        height: 28,
        padding: '6px 10px',
        fontSize: 11.5,
        color: !canEmailFeedback(event) ? theme.textTertiary : theme.textSecondary,
      }}
    >
      {event.feedbackRequested ? 'Request again' : 'Request feedback'}
    </Button>
  );
}

export function RequestInbox({ events }: { events: SourcingEvent[] }) {
  const updateEventStatus = useStore((s) => s.updateEventStatus);
  const requestEventFeedback = useStore((s) => s.requestEventFeedback);
  const feedbackResponses = useStore((s) => s.feedbackResponses);
  const removeEvent = useStore((s) => s.removeEvent);
  const [filter, setFilter] = useState<'all' | 'new'>('all');

  const requests = useMemo(
    () =>
      events
        .filter((e) => !!e.requestCreatedAt)
        .sort((a, b) => (b.requestCreatedAt ?? '').localeCompare(a.requestCreatedAt ?? '')),
    [events],
  );

  const visible = useMemo(
    () =>
      filter === 'new'
        ? requests.filter((e) => e.status === 'Planned' || e.status === 'Live')
        : requests,
    [requests, filter],
  );

  const totalSpend = visible.reduce((sum, e) => sum + (e.addressable || 0), 0);

  return (
    <Card pad={0}>
      <div
        style={{
          padding: '16px 18px 12px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <CardTitle sub={`${requests.length} request${requests.length === 1 ? '' : 's'} received from users`}>
          Request inbox
        </CardTitle>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: theme.textSecondary,
              padding: '4px 8px',
              background: theme.surfaceMuted,
              borderRadius: 6,
              border: `1px solid ${theme.border}`,
              fontFamily: theme.mono,
            }}
          >
            Pipeline {fmtUSD(totalSpend)}
          </div>
          <div
            style={{
              display: 'flex',
              gap: 4,
              padding: 3,
              background: theme.surfaceMuted,
              borderRadius: 6,
              border: `1px solid ${theme.border}`,
            }}
          >
            {(['all', 'new'] as const).map((f) => {
              const active = filter === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  style={{
                    height: 24,
                    padding: '0 10px',
                    fontSize: 11.5,
                    fontWeight: 700,
                    borderRadius: 4,
                    border: 'none',
                    cursor: 'pointer',
                    background: active ? theme.surface : 'transparent',
                    color: active ? theme.ink : theme.textSecondary,
                    boxShadow: active ? theme.shadow : 'none',
                    textTransform: 'capitalize',
                  }}
                >
                  {f === 'new' ? 'Open only' : 'All'}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto', maxHeight: 600 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1100 }}>
          <thead>
            <tr>
              <th style={th}>Received</th>
              <th style={th}>Requestor</th>
              <th style={th}>Event</th>
              <th style={th}>Category</th>
              <th style={{ ...th, textAlign: 'right' }}>Addressable</th>
              <th style={th}>Status</th>
              <th style={th}>Feedback</th>
              <th style={th}> </th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ ...td, textAlign: 'center', color: theme.textTertiary, padding: 32 }}>
                  No user requests received yet.
                </td>
              </tr>
            ) : (
              visible.map((e) => {
                const cat = CATEGORY_BY_NAME[e.category];
                const isFresh =
                  e.requestCreatedAt &&
                  Date.now() - new Date(e.requestCreatedAt).getTime() < 24 * 60 * 60 * 1000;
                return (
                  <tr key={e.id}>
                    <td style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {isFresh && (
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 800,
                              fontFamily: theme.mono,
                              padding: '2px 5px',
                              borderRadius: 3,
                              background: theme.primary,
                              color: '#fff',
                            }}
                          >
                            NEW
                          </span>
                        )}
                        <span style={{ fontFamily: theme.mono, fontSize: 11.5, color: theme.textSecondary }}>
                          {fmtReceivedAt(e.requestCreatedAt)}
                        </span>
                      </div>
                    </td>
                    <td style={td}>
                      <span style={{ fontSize: 12, color: theme.textSecondary, fontFamily: theme.mono }}>
                        {e.requestor ?? '-'}
                      </span>
                    </td>
                    <td style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: 2,
                            background: cat?.color,
                            flexShrink: 0,
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 600 }}>{e.name}</div>
                          <div
                            style={{
                              fontSize: 10.5,
                              color: theme.textTertiary,
                              fontFamily: theme.mono,
                            }}
                          >
                            {e.id} · {e.fy} · {(e.regions ?? [e.region]).join(', ')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={td}>
                      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
                        <span style={{ fontWeight: 600 }}>{e.category}</span>
                        <span style={{ fontSize: 11, color: theme.textTertiary }}>{e.subcategory}</span>
                      </div>
                    </td>
                    <td style={num}>{fmtUSD(e.addressable)}</td>
                    <td style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <StatusBadge status={e.status} />
                        <select
                          className="ui-select"
                          aria-label={`Change status for ${e.name}`}
                          value={e.status}
                          onChange={(event) => updateEventStatus(e.id, event.target.value as Status)}
                          style={{
                            width: 124,
                            height: 30,
                            fontSize: 11.5,
                            fontWeight: 700,
                            paddingLeft: 9,
                          }}
                        >
                          {STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td style={td}>
                      <FeedbackCell
                        event={e}
                        response={feedbackResponses.find((response) => response.eventId === e.id)}
                        onRequest={() => {
                          if (openFeedbackEmail(e)) void requestEventFeedback(e.id);
                        }}
                      />
                    </td>
                    <td style={td}>
                      <Button
                        variant="ghost"
                        onClick={() => removeEvent(e.id)}
                        style={{ height: 28, padding: '6px 9px', fontSize: 11.5, color: theme.danger }}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
