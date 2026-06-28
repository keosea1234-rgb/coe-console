import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORY_BY_NAME } from '../../domain/categories';
import { fmtUSD, myRequestEvents } from '../../domain/selectors';
import type { SessionUser } from '../../domain/session';
import type { SourcingEvent } from '../../domain/types';
import { theme, numeric, sectionLabel } from '../../styles/theme';
import { Card, CardTitle } from '../common/Card';
import { StatusBadge } from '../common/primitives';

type RequestFilter = 'open' | 'managed' | 'all';

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
  const [filter, setFilter] = useState<RequestFilter>('open');
  const requests = useMemo(() => myRequestEvents(events, user), [events, user]);
  const visible = useMemo(() => {
    if (filter === 'managed') {
      return requests.filter((event) => !!event.archivedAt || event.status !== 'Planned');
    }
    if (filter === 'all') return requests;
    return requests.filter((event) => !event.archivedAt && event.status !== 'Completed');
  }, [filter, requests]);

  const openCount = requests.filter((event) => !event.archivedAt && event.status !== 'Completed').length;
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
        <StatTile label="Open" value={openCount} sub="Not completed or archived" />
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
          <CardTitle sub={`${requests.length} submitted request${requests.length === 1 ? '' : 's'}`}>
            My requests
          </CardTitle>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
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
              {(['open', 'managed', 'all'] as const).map((item) => {
                const active = filter === item;
                const label =
                  item === 'open'
                    ? `Open (${openCount})`
                    : item === 'managed'
                      ? `Managed (${managedCount})`
                      : 'All';
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFilter(item)}
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
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
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
                    {requests.length === 0 ? 'No requests submitted yet.' : 'No requests in this view.'}
                  </td>
                </tr>
              ) : (
                visible.map((event) => {
                  const category = CATEGORY_BY_NAME[event.category];
                  const badges = requestBadges(event);
                  return (
                    <tr key={event.id}>
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
    </>
  );
}
