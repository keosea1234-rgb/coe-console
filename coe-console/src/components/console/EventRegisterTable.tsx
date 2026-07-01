import { useMemo, useState } from 'react';
import { theme } from '../../styles/theme';
import { Card, CardTitle } from '../common/Card';
import { CATEGORY_BY_NAME } from '../../domain/categories';
import type { SourcingEvent } from '../../domain/types';
import { fmtUSD } from '../../domain/selectors';
import { STATUSES, type Status } from '../../domain/constants';
import { useStore } from '../../domain/store';
import { Button, StatusBadge } from '../common/primitives';
import { Modal } from '../common/overlays';
import { openFeedbackEmail } from '../../lib/feedbackEmail';
import { DataTable, type TableColumn } from '../../shared/table';

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
      disabled={disabled}
      onClick={onClick}
      style={{
        height: 28,
        padding: '6px 9px',
        fontSize: 11.5,
        borderColor: disabled ? theme.border : theme.borderStrong,
        color: disabled ? theme.textTertiary : theme.textSecondary,
      }}
    >
      {requested ? 'Ask again' : children}
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
          {event?.requestor?.includes('@')
            ? 'This opens an email to the event requester with the NPS survey link'
            : 'This opens an email draft with the NPS survey link - add the recipient before sending'}
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

  const columns = useMemo<TableColumn<SourcingEvent>[]>(
    () => [
      {
        id: 'event',
        header: 'Event',
        sortable: true,
        sortValue: (event) => event.name,
        minWidth: 230,
        cell: (event) => {
          const category = CATEGORY_BY_NAME[event.category];
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 2,
                  background: category?.color,
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ fontWeight: 600 }}>{event.name}</div>
                <div style={{ fontSize: 10.5, color: theme.textTertiary, fontFamily: theme.mono }}>
                  {event.id}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: 'region',
        header: 'Region',
        sortable: true,
        sortValue: (event) => (event.regions ?? [event.region]).join(', '),
        cell: (event) => (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {(event.regions ?? [event.region]).map((region) => (
              <span
                key={region}
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
                {region}
              </span>
            ))}
          </div>
        ),
      },
      {
        id: 'fy',
        header: 'FY',
        sortable: true,
        sortValue: (event) => event.fy,
        cellStyle: { fontFamily: theme.mono },
        cell: (event) => event.fy,
      },
      {
        id: 'type',
        header: 'Type',
        sortable: true,
        sortValue: (event) => (event.eventTypes ?? [event.type]).join(' + '),
        cell: (event) => (event.eventTypes ?? [event.type]).join(' + '),
      },
      {
        id: 'addressable',
        header: 'Addressable',
        align: 'right',
        sortable: true,
        sortValue: (event) => event.addressable,
        cell: (event) => fmtUSD(event.addressable),
      },
      {
        id: 'sourced',
        header: 'Sourced',
        align: 'right',
        sortable: true,
        sortValue: (event) => event.sourced,
        cell: (event) => fmtUSD(event.sourced),
      },
      {
        id: 'savings',
        header: 'Savings',
        align: 'right',
        sortable: true,
        sortValue: (event) => event.savings,
        cell: (event) => (
          <span style={{ color: event.savings > 0 ? theme.success : theme.textTertiary }}>
            {event.savings > 0 ? fmtUSD(event.savings) : '-'}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        sortable: true,
        sortValue: (event) => event.status,
        minWidth: readOnly ? 100 : 210,
        cell: (event) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusBadge status={event.status} />
            {!readOnly && (
              <select
                className="ui-select"
                aria-label={`Change status for ${event.name}`}
                value={event.status}
                onChange={(selectEvent) => updateEventStatus(event.id, selectEvent.target.value as Status)}
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
        ),
      },
    ],
    [readOnly, updateEventStatus],
  );

  return (
    <Card pad={0}>
      <div style={{ padding: '16px 18px 12px' }}>
        <CardTitle sub={`Latest ${rows.length} events in scope`}>Event register</CardTitle>
      </div>
      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(event) => event.id}
        emptyMessage="No events in the current filter scope."
        pageSize={25}
        pageSizeOptions={[10, 25, 50]}
        minWidth={1040}
        maxHeight={520}
        tableLabel="Event register"
        rowActions={
          readOnly
            ? undefined
            : (event) => (
                <div style={{ display: 'flex', gap: 8 }}>
                  <FeedbackButton
                    requested={event.feedbackRequested}
                    disabled={false}
                    onClick={() => setFeedbackEvent(event)}
                  >
                    Ask feedback
                  </FeedbackButton>
                  {event.requestCreatedAt && (
                    <Button
                      variant="ghost"
                      onClick={() => removeEvent(event.id)}
                      style={{ height: 28, padding: '6px 9px', fontSize: 11.5, color: theme.danger }}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              )
        }
        rowActionsHeader="Ask feedback"
      />
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
