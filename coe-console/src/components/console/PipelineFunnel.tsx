import { theme } from '../../styles/theme';
import { Card, CardTitle } from '../common/Card';
import { STATUS_COLORS } from '../../domain/constants';
import type { StatusBucket } from '../../domain/selectors';
import { fmtUSD, fmtNum } from '../../domain/selectors';

export function PipelineFunnel({ buckets }: { buckets: StatusBucket[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  const total = buckets.reduce((a, b) => a + b.count, 0);

  return (
    <Card>
      <CardTitle sub="By status - bar width by event count">Event pipeline</CardTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
        {total === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: theme.textTertiary, fontSize: 13 }}>
            No events in the current filter scope.
          </div>
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
                    {fmtNum(b.count)} events - {fmtUSD(b.sourced)}
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
