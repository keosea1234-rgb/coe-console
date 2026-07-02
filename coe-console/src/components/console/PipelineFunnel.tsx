import { theme } from '../../styles/theme';
import { Card, CardTitle } from '../common/Card';
import { STATUS_COLORS } from '../../domain/constants';
import type { StatusBucket } from '../../domain/selectors';
import { fmtUSD, fmtNum } from '../../domain/selectors';
import { EmptyState } from './EmptyState';

export function PipelineFunnel({ buckets }: { buckets: StatusBucket[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  const total = buckets.reduce((a, b) => a + b.count, 0);

  return (
    <Card>
      <CardTitle sub="RFx status mix - bar width by event count">Pipeline opportunity by RFx status</CardTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
        {total === 0 ? (
          <EmptyState
            compact
            title="No pipeline events in scope"
            detail="Adjust filters to include planned, live, or completed sourcing events."
          />
        ) : (
          buckets.map((b) => {
            const c = STATUS_COLORS[b.status];
            const pct = b.count / max;
            return (
              <div key={b.status}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 5,
                  }}
                >
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: c.fg }}>{b.status}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: theme.mono,
                      color: theme.textSecondary,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {fmtNum(b.count)} events - {fmtUSD(b.sourced)} sourced spend
                  </span>
                </div>
                <div
                  style={{
                    background: theme.surfaceMuted,
                    borderRadius: 6,
                    height: 14,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${pct * 100}%`,
                      height: '100%',
                      background: c.fg,
                      borderRadius: 6,
                      transition: `width ${theme.transitionMedium} ${theme.easing}`,
                      opacity: 0.85,
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
