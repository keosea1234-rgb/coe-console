import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORY_BY_NAME } from '../../domain/categories';
import { fmtUSD, myRequestEvents } from '../../domain/selectors';
import type { SessionUser } from '../../domain/session';
import type { SourcingEvent } from '../../domain/types';
import { theme, numeric, sectionLabel } from '../../styles/theme';
import { Card, CardTitle } from '../common/Card';
import { Button, StatusBadge } from '../common/primitives';
import { SlideOver } from '../common/overlays';
import { COE_INBOX_EMAIL, openCoeRequestEmail } from '../../lib/coeRequestEmail';

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
  padding: '11px 12px',
  borderBottom: `1px solid ${theme.border}`,
  color: theme.ink,
  verticalAlign: 'top',
};

const num: React.CSSProperties = {
  ...td,
  ...numeric,
  textAlign: 'right',
};

function fmtSubmittedAt(iso: string | undefined): string {
  if (!iso) return '-';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function followUpLabel(event: SourcingEvent): string {
  if (event.archivedAt) return `Archived ${fmtSubmittedAt(event.archivedAt)}`;
  if (event.status === 'Completed') return 'Completed by CoE';
  if (event.status === 'Live') return 'Managed by CoE';
  return 'Submitted for review';
}

function scopeText(event: SourcingEvent): string {
  const regions = (event.regions ?? [event.region]).join(', ');
  const types = (event.eventTypes ?? [event.type]).join(', ');
  return `${event.fy} / ${regions} / ${types}`;
}

function requestBadges(event: SourcingEvent): string[] {
  return [
    event.directness,
    event.shouldCostModeling ? 'Should-cost' : undefined,
    event.riskAssessment ? 'Risk' : undefined,
    event.esgAssessment ? 'ESG' : undefined,
  ].filter(Boolean) as string[];
}

function StatTile({ label, value, sub }: { label: string; value: React.ReactNode; sub: string }) {
  return (
    <Card pad={14} variant="raised" style={{ minHeight: 94 }}>
      <div style={sectionLabel}>{label}</div>
      <div style={{ marginTop: 8, fontSize: 22, fontWeight: 850, color: theme.ink, ...numeric }}>
        {value}
      </div>
      <div style={{ marginTop: 4, fontSize: 11.5, color: theme.textSecondary, lineHeight: 1.35 }}>
        {sub}
      </div>
    </Card>
  );
}

export function MyRequests({
  events,
  user,
}: {
  events: SourcingEvent[];
  user: Pick<SessionUser, 'id' | 'email'> | null;
}) {
  const [selected, setSelected] = useState<SourcingEvent | null>(null);
  const requests = useMemo(() => myRequestEvents(events, user), [events, user]);
  const visible = requests;

  const openCount = requests.filter((event) => !event.archivedAt && event.status === 'Planned').length;
  const managedCount = requests.filter((event) => !!event.archivedAt || event.status !== 'Planned').length;
  const completedCount = requests.filter((event) => event.status === 'Completed').length;
  const pipeline = requests.reduce((sum, event) => sum + event.addressable, 0);

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
        }}
      >
        <StatTile label="Submitted" value={requests.length} sub="Total eSourcing requests" />
        <StatTile label="Open" value={openCount} sub="Awaiting CoE pickup" />
        <StatTile label="Managed" value={managedCount} sub="Live, completed, or archived" />
        <StatTile label="Pipeline" value={fmtUSD(pipeline)} sub="Submitted addressable spend" />
      </div>

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
          <CardTitle sub={`${requests.length} submitted request${requests.length === 1 ? '' : 's'} - click a row to open it`}>
            My requests
          </CardTitle>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Link
              to="/new-request"
              className="ui-btn ui-btn--primary"
              style={{ textDecoration: 'none', height: 30, padding: '6px 11px', fontSize: 12 }}
            >
              New Event Request
            </Link>
          </div>
        </div>

        <div style={{ overflowX: 'auto', maxHeight: 600 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
            <thead>
              <tr>
                <th style={th}>Submitted</th>
                <th style={th}>Request</th>
                <th style={th}>Scope</th>
                <th style={{ ...th, textAlign: 'right' }}>Addressable</th>
                <th style={th}>Status</th>
                <th style={th}>CoE follow-up</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ ...td, textAlign: 'center', color: theme.textTertiary, padding: 32 }}>
                    No requests submitted yet.
                  </td>
                </tr>
              ) : (
                visible.map((event) => {
                  const category = CATEGORY_BY_NAME[event.category];
                  const badges = requestBadges(event);
                  return (
                    <tr
                      key={event.id}
                      onClick={() => setSelected(event)}
                      title="Open request"
                      style={{ cursor: 'pointer' }}
                      className="my-request-row"
                    >
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'grid', gap: 3 }}>
                          <span style={{ fontFamily: theme.mono, fontSize: 11.5, color: theme.textSecondary }}>
                            {fmtSubmittedAt(event.requestCreatedAt)}
                          </span>
                          <span style={{ fontFamily: theme.mono, fontSize: 10.5, color: theme.textTertiary }}>
                            {event.id}
                          </span>
                        </div>
                      </td>
                      <td style={td}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', minWidth: 220 }}>
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: 2,
                              background: category?.color ?? theme.primary,
                              marginTop: 6,
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ display: 'grid', gap: 4 }}>
                            <span style={{ fontWeight: 700, lineHeight: 1.25 }}>{event.name}</span>
                            <span style={{ fontSize: 11, color: theme.textSecondary, lineHeight: 1.35 }}>
                              {event.category} / {event.subcategory}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={td}>
                        <div style={{ display: 'grid', gap: 6, minWidth: 220 }}>
                          <span style={{ color: theme.textSecondary, lineHeight: 1.35 }}>{scopeText(event)}</span>
                          {badges.length > 0 && (
                            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                              {badges.map((badge) => (
                                <span
                                  key={badge}
                                  style={{
                                    fontSize: 10.5,
                                    fontWeight: 800,
                                    fontFamily: theme.mono,
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    color: theme.textSecondary,
                                    background: theme.surfaceMuted,
                                    border: `1px solid ${theme.border}`,
                                  }}
                                >
                                  {badge}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={num}>{fmtUSD(event.addressable)}</td>
                      <td style={td}>
                        <StatusBadge status={event.status} />
                      </td>
                      <td style={td}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            minHeight: 24,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: event.archivedAt ? theme.surfaceMuted : theme.infoBg,
                            color: event.archivedAt ? theme.textTertiary : theme.info,
                            fontSize: 11.5,
                            fontWeight: 800,
                            fontFamily: theme.mono,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {followUpLabel(event)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {completedCount > 0 && (
        <div style={{ fontSize: 11.5, color: theme.textTertiary, fontFamily: theme.mono }}>
          Completed requests: {completedCount}
        </div>
      )}

      <RequestDetail key={selected?.id ?? 'none'} event={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        padding: '9px 0',
        borderBottom: `1px solid ${theme.border}`,
      }}
    >
      <span style={{ fontSize: 11.5, color: theme.textTertiary, fontFamily: theme.mono }}>{label}</span>
      <span style={{ fontSize: 12.5, color: theme.ink, fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function RequestDetail({ event, onClose }: { event: SourcingEvent | null; onClose: () => void }) {
  const [message, setMessage] = useState('');

  if (!event) return null;
  const badges = requestBadges(event);

  return (
    <SlideOver
      open={!!event}
      onClose={onClose}
      width={460}
      title={
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: theme.ink, lineHeight: 1.2 }}>{event.name}</div>
          <div style={{ fontSize: 11, color: theme.textTertiary, fontFamily: theme.mono, marginTop: 2 }}>
            {event.id}
          </div>
        </div>
      }
    >
      <div style={{ padding: '16px 18px', display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <StatusBadge status={event.status} />
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '3px 8px',
              borderRadius: 6,
              background: event.archivedAt ? theme.surfaceMuted : theme.infoBg,
              color: event.archivedAt ? theme.textTertiary : theme.info,
              fontSize: 11.5,
              fontWeight: 800,
              fontFamily: theme.mono,
            }}
          >
            {followUpLabel(event)}
          </span>
        </div>

        <div>
          <DetailRow label="Submitted" value={fmtSubmittedAt(event.requestCreatedAt)} />
          <DetailRow label="Scope" value={scopeText(event)} />
          <DetailRow label="Category" value={`${event.category} / ${event.subcategory}`} />
          <DetailRow label="Addressable" value={fmtUSD(event.addressable)} />
          <DetailRow label="Requestor" value={event.requestor ?? '-'} />
          {badges.length > 0 && (
            <div style={{ paddingTop: 10, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {badges.map((badge) => (
                <span
                  key={badge}
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    fontFamily: theme.mono,
                    padding: '2px 6px',
                    borderRadius: 4,
                    color: theme.textSecondary,
                    background: theme.surfaceMuted,
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          <div style={sectionLabel}>Send a request to the CoE</div>
          <p style={{ margin: 0, fontSize: 12, color: theme.textSecondary, lineHeight: 1.45 }}>
            Ask the eSourcing CoE a question or request support for this event. We'll prefill the event
            context and open your email to {COE_INBOX_EMAIL}.
          </p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="e.g. Please prioritise this event - supplier deadline moved up two weeks."
            style={{
              width: '100%',
              resize: 'vertical',
              borderRadius: theme.radiusSm,
              border: `1px solid ${theme.borderStrong}`,
              background: theme.surface,
              color: theme.ink,
              padding: '10px 12px',
              fontSize: 12.5,
              lineHeight: 1.5,
              fontFamily: 'inherit',
            }}
          />
          <Button
            variant="primary"
            onClick={() => openCoeRequestEmail(event, message)}
            style={{ alignSelf: 'flex-start' }}
          >
            Send to CoE
          </Button>
        </div>
      </div>
    </SlideOver>
  );
}
