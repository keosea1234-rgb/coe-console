import { Card, CardTitle } from '../common/Card';
import { REGIONS, REGION_LABEL, type Region } from '../../domain/constants';
import type { MatrixCell } from '../../domain/selectors';
import { fmtUSD, fmtPct } from '../../domain/selectors';
import { coverageLegendGradient, coverageRgb, luminance } from './coverageColors';
import { EmptyState } from './EmptyState';

function cellVars(coverage: number): React.CSSProperties {
  const [r, g, b] = coverageRgb(coverage).map(Math.round) as [number, number, number];
  const dark = luminance([r, g, b]) < 0.42;
  const vars: Record<string, string> = {
    '--cell': `rgb(${r},${g},${b})`,
    '--cell-fg': dark ? '#ffffff' : '#1f2937',
    '--cell-fg2': dark ? 'rgba(255,255,255,.82)' : 'rgba(31,41,55,.64)',
    '--cell-bd': dark ? 'rgba(255,255,255,.2)' : 'rgba(15,23,42,.07)',
    '--cell-track': dark ? 'rgba(255,255,255,.22)' : 'rgba(15,23,42,.10)',
    '--cell-fill': dark ? 'rgba(255,255,255,.9)' : 'rgba(31,41,55,.48)',
    '--cov': `${Math.round(Math.min(1, coverage) * 100)}%`,
  };
  return vars as React.CSSProperties;
}

export function CoverageMatrix({
  rows,
  onSelect,
}: {
  rows: { category: string; color: string; cells: Record<Region, MatrixCell> }[];
  onSelect: (category: string) => void;
}) {
  return (
    <Card pad={0}>
      <div className="cov-matrix-head">
        <CardTitle sub="Spend coverage intensity by region - select a category to inspect the sourcing gap">
          Category x Region spend coverage
        </CardTitle>
        <div className="cov-legend" aria-hidden="true">
          <span className="cov-legend-cap">Low</span>
          <span className="cov-legend-grad" style={{ background: coverageLegendGradient }} />
          <span className="cov-legend-cap">High</span>
        </div>
      </div>

      <div className="cov-matrix-scroll">
        {rows.length === 0 ? (
          <EmptyState
            title="No filtered coverage results"
            detail="Clear filters or add addressable spend baseline values to populate the matrix."
          />
        ) : (
        <table className="cov-table" aria-label="Category by region spend coverage matrix">
          <thead>
            <tr>
              <th className="cov-th cov-th--cat">Category</th>
              {REGIONS.map((r) => (
                <th key={r} className="cov-th" title={REGION_LABEL[r]}>
                  {r}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.category} className="cov-row">
                <td>
                  <button type="button" className="cov-row-btn" onClick={() => onSelect(row.category)}>
                    <span className="cov-dot" style={{ background: row.color }} />
                    <span className="cov-row-name">{row.category}</span>
                    <svg
                      className="cov-chevron"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="9 6 15 12 9 18" />
                    </svg>
                  </button>
                </td>
                {REGIONS.map((r) => {
                  const cell = row.cells[r];
                  if (cell.addressable === 0 && cell.sourced === 0) {
                    return (
                      <td key={r}>
                        <div className="cov-cell cov-cell--empty" title="No addressable spend baseline">
                          -
                        </div>
                      </td>
                    );
                  }
                  return (
                    <td key={r}>
                      <div
                        className="cov-cell"
                        style={cellVars(cell.coverage)}
                        title={`${fmtUSD(cell.sourced)} sourced spend of ${fmtUSD(cell.addressable)} addressable spend`}
                      >
                        <span className="cov-cell-pct">{fmtPct(cell.coverage)}</span>
                        <span className="cov-cell-usd">{fmtUSD(cell.sourced)}</span>
                        <span className="cov-cell-bar">
                          <i />
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </Card>
  );
}
