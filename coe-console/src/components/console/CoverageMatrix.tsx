import { Card, CardTitle } from '../common/Card';
import { REGIONS, REGION_LABEL, type Region } from '../../domain/constants';
import type { MatrixCell } from '../../domain/selectors';
import { fmtUSD, fmtPct } from '../../domain/selectors';

// Sequential brand scale (pale blue -> deep indigo) — replaces the old teal ramp
// so the heatmap reads as part of the console's blue/indigo identity.
const SCALE: [number, [number, number, number]][] = [
  [0.0, [234, 241, 252]], // #EAF1FC
  [0.3, [179, 206, 246]], // #B3CEF6
  [0.55, [108, 152, 235]], // #6C98EB
  [0.78, [55, 96, 196]], // #3760C4
  [1.0, [30, 58, 138]], // #1E3A8A (brand primary)
];

const legendGradient = `linear-gradient(90deg, ${SCALE.map(
  ([t, c]) => `rgb(${c[0]},${c[1]},${c[2]}) ${Math.round(t * 100)}%`,
).join(', ')})`;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function scaleColor(t: number): [number, number, number] {
  const x = Math.max(0, Math.min(1, t));
  for (let i = 1; i < SCALE.length; i++) {
    const [t1, c1] = SCALE[i];
    const [t0, c0] = SCALE[i - 1];
    if (x <= t1) {
      const k = (x - t0) / (t1 - t0);
      return [lerp(c0[0], c1[0], k), lerp(c0[1], c1[1], k), lerp(c0[2], c1[2], k)];
    }
  }
  return SCALE[SCALE.length - 1][1];
}

// WCAG relative luminance — drives the white/navy text switch per cell.
function luminance([r, g, b]: [number, number, number]): number {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function cellVars(coverage: number): React.CSSProperties {
  const [r, g, b] = scaleColor(coverage).map(Math.round) as [number, number, number];
  const dark = luminance([r, g, b]) < 0.5;
  const vars: Record<string, string> = {
    '--cell': `rgb(${r},${g},${b})`,
    '--cell-fg': dark ? '#ffffff' : '#15294f',
    '--cell-fg2': dark ? 'rgba(255,255,255,.82)' : 'rgba(21,41,79,.62)',
    '--cell-bd': dark ? 'rgba(255,255,255,.14)' : 'rgba(15,23,42,.08)',
    '--cell-track': dark ? 'rgba(255,255,255,.22)' : 'rgba(15,23,42,.10)',
    '--cell-fill': dark ? 'rgba(255,255,255,.9)' : '#2563eb',
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
        <CardTitle sub="Coverage intensity by region · click a category to open the deep-dive">
          Category × Region coverage matrix
        </CardTitle>
        <div className="cov-legend" aria-hidden="true">
          <span className="cov-legend-cap">Low</span>
          <span className="cov-legend-grad" style={{ background: legendGradient }} />
          <span className="cov-legend-cap">High</span>
        </div>
      </div>

      <div className="cov-matrix-scroll">
        <table className="cov-table">
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
                        <div className="cov-cell cov-cell--empty" title="No baseline">
                          —
                        </div>
                      </td>
                    );
                  }
                  return (
                    <td key={r}>
                      <div
                        className="cov-cell"
                        style={cellVars(cell.coverage)}
                        title={`${fmtUSD(cell.sourced)} sourced of ${fmtUSD(cell.addressable)}`}
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
      </div>
    </Card>
  );
}
