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
        label="RFx events"
        value={fmtNum(totals.events)}
        helpText="Events in the current filter scope, grouped by the console RFx status model."
        sub={
          <>
            {totals.live} live / {totals.done} completed
          </>
        }
      />
      <KpiCard
        label="Sourced spend"
        value={fmtUSD(totals.sourced)}
        helpText="Spend already covered by completed or active sourcing events in scope."
        sub={<>of {fmtUSD(totals.addressable)} addressable spend</>}
      />
      <KpiCard
        label="Spend coverage"
        value={fmtPct(totals.coverage)}
        accent={theme.primary}
        helpText="Sourced spend divided by addressable spend baseline for the active filters."
      >
        <div style={{ marginTop: 8 }}>
          <ProgressBar value={totals.coverage} color={theme.primary} />
        </div>
      </KpiCard>
      <KpiCard
        label="Realized savings"
        value={fmtUSD(totals.savings)}
        accent={theme.info}
        helpText="Savings recorded on sourced events in the current scope."
      />
      <KpiCard
        label="Savings rate"
        value={fmtPct(totals.savingsRate, 1)}
        accent="#3b82f6"
        helpText="Realized savings divided by sourced spend."
      />
    </div>
  );
}
