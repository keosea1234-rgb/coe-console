import { useState } from 'react';
import { theme } from '../../styles/theme';
import { Card, CardTitle } from '../common/Card';
import { CATEGORY_BY_NAME } from '../../domain/categories';
import type { SourcingEvent } from '../../domain/types';
import { fmtUSD } from '../../domain/selectors';
import { STATUSES, type Status } from '../../domain/constants';
import { useStore } from '../../domain/store';
import { Button, StatusBadge } from '../common/primitives';
import { Modal } from '../common/overlays';
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
  padding: '9px 12px',
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
const actionCell: React.CSSProperties = {
  ...td,
  minWidth: 190,
};

function FeedbackButton({
  requested,
  disabled,
  children,
  onClick,
}: {
  requested?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      variant="secondary"
      disabled={requested || disabled}
      onClick={onClick}
      style={{
        height: 28,
        padding: '6px 9px',
        fontSize: 11.5,
        borderColor: requested || disabled ? theme.border : theme.borderStrong,
        color: requested || disabled ? theme.textTertiary : theme.textSecondary,
      }}
    >
      {requested ? 'Sent' : children}
    </Button>
  );
}

function NpsScale() {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(11, minmax(0, 1fr))', gap: 6 }}>
        {Array.from({ length: 11 }, (_, score) => (
          <button
            key={score}
            type="button"
            disabled
            style={{
              height: 30,
              borderRadius: 6,
              border: `1px solid ${theme.borderStrong}`,
              background: theme.surface,
              color: theme.textSecondary,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'default',
            }}
          >
            {score}
          </button>
        ))}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          marginTop: 4,
          fontSize: 9.5,
          color: theme.textTertiary,
        }}
      >
        <span>Not at all</span>
        <span style={{ textAlign: 'center' }}>Neutral</span>
        <span style={{ textAlign: 'right' }}>Recommend</span>
      </div>
    </div>
  );
}

function FeedbackSurveyModal({
  event,
  onClose,
  onSend,
}: {
  event: SourcingEvent | null;
  onClose: () => void;
  onSend: () => void;
}) {
  return (
    <Modal open={!!event} onClose={onClose} maxWidth={520}>
      <div>
        <div style={{ padding: '14px 18px', background: '#23372f', color: '#fff' }}>
          <div style={{ fontSize: 13, fontWeight: 800 }}>Training & Development</div>
          {event && (
            <div style={{ marginTop: 2, fontSize: 11, color: 'rgba(255,255,255,.68)' }}>
              {event.id} - {event.name}
            </div>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            background: '#edf8f0',
            borderBottom: '1px solid #cdebd7',
            color: '#0f766e',
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: 999, background: theme.primary }} />
          This opens an email to the event requester with the NPS survey link
        </div>
        <div style={{ padding: '18px', display: 'grid', gap: 22 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: theme.ink }}>
              1. How would you rate the eSourcing tool for this event?
            </div>
            <div style={{ fontSize: 11, color: theme.textTertiary, marginTop: 2 }}>
              0 = Would not recommend · 10 = Would definitely recommend
            </div>
            <div style={{ marginTop: 12 }}>
              <NpsScale />
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: theme.ink }}>
              2. How would you rate the CoE team support?
            </div>
            <div style={{ fontSize: 11, color: theme.textTertiary, marginTop: 2 }}>
              0 = Would not recommend · 10 = Would definitely recommend
            </div>
            <div style={{ marginTop: 12 }}>
              <NpsScale />
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            padding: '14px 18px',
            borderTop: `1px solid ${theme.border}`,
            background: theme.surfaceRaised,
          }}
        >
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onSend}>
            Send Survey -&gt;
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function EventRegisterTable({
  events,
  readOnly = false,
}: {
  events: SourcingEvent[];
  readOnly?: boolean;
}) {
  const updateEventStatus = useStore((s) => s.updateEventStatus);
  const requestEventFeedback = useStore((s) => s.requestEventFeedback);
  const removeEvent = useStore((s) => s.removeEvent);
  const [feedbackEvent, setFeedbackEvent] = useState<SourcingEvent | null>(null);
  const rows = events.slice(0, 50);
  return (
    <Card pad={0}>
      <div style={{ padding: '16px 18px 12px' }}>
        <CardTitle sub={`Latest ${rows.length} events in scope`}>Event register</CardTitle>
      </div>
      <div style={{ overflowX: 'auto', maxHeight: 520 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1040 }}>
          <thead>
            <tr>
              <th style={th}>Event</th>
              <th style={th}>Region</th>
              <th style={th}>FY</th>
              <th style={th}>Type</th>
              <th style={{ ...th, textAlign: 'right' }}>Addressable</th>
              <th style={{ ...th, textAlign: 'right' }}>Sourced</th>
              <th style={{ ...th, textAlign: 'right' }}>Savings</th>
              <th style={th}>Status</th>
              {!readOnly && <th style={th}>Ask feedback</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={readOnly ? 8 : 9} style={{ ...td, textAlign: 'center', color: theme.textTertiary, padding: 32 }}>
                  No events in the current filter scope.
                </td>
              </tr>
            ) : (
              rows.map((e) => {
                const cat = CATEGORY_BY_NAME[e.category];
                return (
                  <tr
                    key={e.id}
                    style={{ transition: `background ${theme.transitionFast} ${theme.easing}` }}
                    onMouseEnter={(ev) => {
                      ev.currentTarget.style.background = theme.surfaceMuted;
                    }}
                    onMouseLeave={(ev) => {
                      ev.currentTarget.style.background = 'transparent';
                    }}
                  >
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
                            {e.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={td}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {(e.regions ?? [e.region]).map((r) => (
                          <span
                            key={r}
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              fontFamily: theme.mono,
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: theme.surfaceMuted,
                              border: `1px solid ${theme.border}`,
                              color: theme.textSecondary,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ ...td, fontFamily: theme.mono }}>{e.fy}</td>
                    <td style={td}>{(e.eventTypes ?? [e.type]).join(' + ')}</td>
                    <td style={num}>{fmtUSD(e.addressable)}</td>
                    <td style={num}>{fmtUSD(e.sourced)}</td>
                    <td style={{ ...num, color: e.savings > 0 ? theme.success : theme.textTertiary }}>
                      {e.savings > 0 ? fmtUSD(e.savings) : '-'}
                    </td>
                    <td style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <StatusBadge status={e.status} />
                        {!readOnly && (
                          <select
                            className="ui-select"
                            aria-label={`Change status for ${e.name}`}
                            value={e.status}
                            onChange={(event) => updateEventStatus(e.id, event.target.value as Status)}
                            style={{
                              width: 116,
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
                        )}
                      </div>
                    </td>
                    {!readOnly && (
                      <td style={actionCell}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <FeedbackButton
                            requested={e.feedbackRequested}
                            disabled={!canEmailFeedback(e)}
                            onClick={() => setFeedbackEvent(e)}
                          >
                            Ask feedback
                          </FeedbackButton>
                          {e.requestCreatedAt && (
                            <Button
                              variant="ghost"
                              onClick={() => removeEvent(e.id)}
                              style={{ height: 28, padding: '6px 9px', fontSize: 11.5, color: theme.danger }}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <FeedbackSurveyModal
        event={feedbackEvent}
        onClose={() => setFeedbackEvent(null)}
        onSend={() => {
          if (!feedbackEvent) return;
          if (openFeedbackEmail(feedbackEvent)) {
            requestEventFeedback(feedbackEvent.id);
          }
          setFeedbackEvent(null);
        }}
      />
    </Card>
  );
}
