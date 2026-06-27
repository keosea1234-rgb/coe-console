import { theme } from '../../styles/theme';
import { Card, CardTitle } from '../common/Card';
import { REGION_LABEL } from '../../domain/constants';
import type { RegionPerf } from '../../domain/selectors';
import { fmtUSD, fmtPct } from '../../domain/selectors';
import { ProgressBar } from '../common/primitives';

export function RegionPerformance({ rows }: { rows: RegionPerf[] }) {
  return (
    <Card>
      <CardTitle sub="Sourced spend, coverage and auction share by business group">
        Region / BG performance
      </CardTitle>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))',
          gap: 10,
          marginTop: 14,
        }}
      >
        {rows.map((r) => (
          <div
            key={r.region}
            style={{
              border: `1px solid ${theme.border}`,
              borderRadius: theme.radiusSm,
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              background: theme.surfaceRaised,
              transition: `border-color ${theme.transitionFast} ${theme.easing}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = theme.borderStrong;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = theme.border;
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: theme.ink }}>{r.region}</span>
              <span style={{ fontSize: 10, color: theme.textTertiary }}>{REGION_LABEL[r.region]}</span>
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 800,
                fontFamily: theme.mono,
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
                color: theme.ink,
              }}
            >
              {fmtUSD(r.sourced)}
            </div>
            <div>
              <Row label="Coverage" value={fmtPct(r.coverage)} />
              <ProgressBar value={r.coverage} color={theme.primary} height={5} />
            </div>
            <Row label="Auction share" value={fmtPct(r.auctionShare)} />
          </div>
        ))}
      </div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 11,
        marginBottom: 4,
        lineHeight: 1.3,
      }}
    >
      <span style={{ color: theme.textSecondary }}>{label}</span>
      <span
        style={{
          fontFamily: theme.mono,
          fontWeight: 700,
          color: theme.ink,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
    </div>
  );
}
