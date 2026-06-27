import { theme } from '../../styles/theme';
import { REGION_LABEL } from '../../domain/constants';
import type { Insights } from '../../domain/selectors';
import { fmtUSD, fmtPct } from '../../domain/selectors';
import { IconTarget, IconTrend, IconLayers } from './icons';

function InsightCard({
  accent,
  icon,
  eyebrow,
  headline,
  detail,
}: {
  accent: string;
  icon: React.ReactNode;
  eyebrow: string;
  headline: React.ReactNode;
  detail: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: theme.radius,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minHeight: 120,
        boxShadow: theme.shadow,
        transition: `box-shadow ${theme.transitionMedium} ${theme.easing}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = theme.shadowRaised;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = theme.shadow;
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: `${accent}14`,
            color: accent,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '.07em',
            textTransform: 'uppercase',
            color: theme.textTertiary,
            fontFamily: theme.mono,
          }}
        >
          {eyebrow}
        </span>
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          lineHeight: 1.3,
          color: theme.ink,
        }}
      >
        {headline}
      </div>
      <div style={{ fontSize: 12.5, color: theme.textSecondary, lineHeight: 1.45 }}>{detail}</div>
    </div>
  );
}

export function InsightsStrip({ insights }: { insights: Insights }) {
  const { auctionLeader, auctionLaggard, coverageGapCategory, growthPipeline } = insights;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 12,
      }}
    >
      <InsightCard
        accent={theme.chart2}
        icon={<IconTarget size={15} />}
        eyebrow="Auction adoption"
        headline={
          <>
            {REGION_LABEL[auctionLeader.region]} leads at {fmtPct(auctionLeader.share)}
          </>
        }
        detail={
          <>
            {REGION_LABEL[auctionLaggard.region]} trails at {fmtPct(auctionLaggard.share)} - largest
            competitive-tension gap to close.
          </>
        }
      />
      <InsightCard
        accent={theme.warning}
        icon={<IconLayers size={15} />}
        eyebrow="Coverage gap"
        headline={
          <>
            {coverageGapCategory.category} at {fmtPct(coverageGapCategory.coverage)}
          </>
        }
        detail={<>Lowest-covered category in scope - prime target for the next sourcing wave.</>}
      />
      <InsightCard
        accent={theme.chart6}
        icon={<IconTrend size={15} />}
        eyebrow="Growth pipeline"
        headline={
          <>
            {growthPipeline.category} - {fmtUSD(growthPipeline.addressable)}
          </>
        }
        detail={<>Largest FY27 planned addressable spend - the headline opportunity ahead.</>}
      />
    </div>
  );
}
