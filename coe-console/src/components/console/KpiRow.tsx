import { theme } from '../../styles/theme';
import type { Totals } from '../../domain/selectors';
import { fmtUSD, fmtPct, fmtNum } from '../../domain/selectors';
import { KpiCard, ProgressBar } from '../common/primitives';

export function KpiRow({ totals }: { totals: Totals }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 14,
      }}
    >
      <KpiCard
        label="Events"
        value={fmtNum(totals.events)}
        sub={
          <>
            {totals.live} live · {totals.done} done
          </>
        }
      />
      <KpiCard
        label="Sourced spend"
        value={fmtUSD(totals.sourced)}
        sub={<>of {fmtUSD(totals.addressable)} addressable</>}
      />
      <KpiCard label="Spend coverage" value={fmtPct(totals.coverage)} accent={theme.primary}>
        <div style={{ marginTop: 8 }}>
          <ProgressBar value={totals.coverage} color={theme.primary} />
        </div>
      </KpiCard>
      <KpiCard label="Realized savings" value={fmtUSD(totals.savings)} accent={theme.info} />
      <KpiCard label="Savings rate" value={fmtPct(totals.savingsRate, 1)} accent="#3b82f6" />
    </div>
  );
}
