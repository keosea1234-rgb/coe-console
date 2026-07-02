import { theme } from '../../styles/theme';
import { Card, CardTitle } from '../common/Card';
import { CATEGORY_BY_NAME } from '../../domain/categories';
import type { SourcingEvent } from '../../domain/types';
import { fmtUSD } from '../../domain/selectors';
import { StatusBadge } from '../common/primitives';
import { EmptyState } from './EmptyState';

export function EventTimeline({ events }: { events: SourcingEvent[] }) {
  const today = new Date('2026-06-24');
  const upcoming = events
    .filter((e) => e.status === 'Live' || e.status === 'Planned')
    .filter((e) => new Date(e.startDate) >= new Date('2026-01-01'))
    .sort((a, b) => +new Date(a.startDate) - +new Date(b.startDate))
    .slice(0, 12);

  return (
    <Card>
      <CardTitle sub="Next 12 planned or live RFx events by start date">Live &amp; upcoming RFx events</CardTitle>
      {upcoming.length === 0 ? (
        <Empty />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 10 }}>
          {upcoming.map((e, i) => {
            const cat = CATEGORY_BY_NAME[e.category];
            const d = new Date(e.startDate);
            const future = d >= today;
            return (
              <div
                key={e.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '52px 1fr auto',
                  gap: 12,
                  alignItems: 'center',
                  padding: '10px 6px',
                  borderTop: i === 0 ? 'none' : `1px solid ${theme.border}`,
                  borderRadius: theme.radiusSm,
                  transition: `background ${theme.transitionFast} ${theme.easing}`,
                }}
                onMouseEnter={(ev) => {
                  ev.currentTarget.style.background = theme.surfaceMuted;
                }}
                onMouseLeave={(ev) => {
                  ev.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      fontFamily: theme.mono,
                      color: future ? theme.primary : theme.textSecondary,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {d.getDate()}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: theme.textTertiary,
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}
                  >
                    {d.toLocaleString('en-US', { month: 'short' })}
                  </div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      color: theme.ink,
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 2,
                        background: cat?.color,
                        flexShrink: 0,
                      }}
                    />
                    {e.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: theme.textSecondary,
                      fontFamily: theme.mono,
                      marginTop: 2,
                    }}
                  >
                    {e.id} - {(e.eventTypes ?? [e.type]).join(' + ')} - {fmtUSD(e.addressable)} addressable spend
                  </div>
                </div>
                <StatusBadge status={e.status} />
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function Empty() {
  return (
    <div style={{ marginTop: 12 }}>
      <EmptyState
        compact
        title="No live or upcoming RFx events"
        detail="Adjust filters or add planned sourcing events to populate the timeline."
      />
    </div>
  );
}
