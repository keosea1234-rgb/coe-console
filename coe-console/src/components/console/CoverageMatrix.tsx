import { theme } from '../../styles/theme';
import { Card, CardTitle } from '../common/Card';
import { REGIONS, type Region } from '../../domain/constants';
import type { MatrixCell } from '../../domain/selectors';
import { fmtUSD, fmtPct } from '../../domain/selectors';

const th: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '.06em',
  textTransform: 'uppercase',
  color: theme.textTertiary,
  fontFamily: theme.mono,
  padding: '8px 8px',
};

function cellStyle(coverage: number): React.CSSProperties {
  const alpha = 0.08 + Math.min(1, coverage) * 0.6;
  const dark = coverage > 0.5;
  return {
    background: `rgba(30,58,138,${alpha.toFixed(3)})`,
    color: dark ? '#fff' : theme.muted5,
    border: 'none',
    width: '100%',
    borderRadius: 6,
    padding: '8px 6px',
    textAlign: 'center',
    fontFamily: theme.mono,
    lineHeight: 1.25,
    transition: `transform ${theme.transitionFast} ${theme.easing}, box-shadow ${theme.transitionFast} ${theme.easing}`,
    cursor: 'pointer',
  };
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
      <div style={{ padding: '16px 18px 10px' }}>
        <CardTitle sub="Coverage intensity - click a category for the deep-dive">
          Category x Region coverage matrix
        </CardTitle>
      </div>
      <div style={{ overflowX: 'auto', padding: '0 14px 16px' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '3px', minWidth: 540 }}>
          <thead>
            <tr>
              <th style={{ ...th, textAlign: 'left', minWidth: 150 }}>Category</th>
              {REGIONS.map((r) => (
                <th key={r} style={th}>
                  {r}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.category}>
                <td>
                  <button
                    type="button"
                    onClick={() => onSelect(row.category)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      fontSize: 12,
                      fontWeight: 600,
                      color: theme.ink,
                      padding: '4px 2px',
                      textAlign: 'left',
                      borderRadius: 4,
                      transition: `color ${theme.transitionFast} ${theme.easing}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = theme.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = theme.ink;
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: row.color, flexShrink: 0 }} />
                    {row.category}
                  </button>
                </td>
                {REGIONS.map((r) => {
                  const cell = row.cells[r];
                  return (
                    <td key={r}>
                      <button
                        type="button"
                        onClick={() => onSelect(row.category)}
                        style={cellStyle(cell.coverage)}
                        title={`${fmtUSD(cell.sourced)} sourced — open ${row.category} deep-dive`}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.04)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,31,74,.18)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                          {fmtPct(cell.coverage)}
                        </div>
                        <div style={{ fontSize: 9, opacity: 0.85, fontVariantNumeric: 'tabular-nums' }}>
                          {fmtUSD(cell.sourced)}
                        </div>
                      </button>
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
