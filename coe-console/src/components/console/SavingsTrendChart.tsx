import { theme } from '../../styles/theme';
import { Card, CardTitle } from '../common/Card';
import type { QuarterPoint } from '../../domain/selectors';
import { fmtUSD } from '../../domain/selectors';

export function SavingsTrendChart({ points }: { points: QuarterPoint[] }) {
  const W = 560;
  const H = 210;
  const padL = 12;
  const padR = 12;
  const padT = 16;
  const padB = 28;
  const max = Math.max(1, ...points.map((p) => p.savings));
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const n = points.length;

  const x = (i: number) => padL + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => padT + innerH - (v / max) * innerH;

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.savings)}`).join(' ');
  const areaPath = `${linePath} L ${x(n - 1)} ${padT + innerH} L ${x(0)} ${padT + innerH} Z`;
  const total = points.reduce((a, p) => a + p.savings, 0);

  if (total === 0) {
    return (
      <Card>
        <CardTitle sub="Across 12 fiscal quarters (Amcor FY)">Realized savings trend</CardTitle>
        <div style={{ padding: '28px 0', textAlign: 'center', color: theme.textTertiary, fontSize: 13 }}>
          No realized savings in the current filter scope.
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <CardTitle sub="Across 12 fiscal quarters (Amcor FY)">Realized savings trend</CardTitle>
        <span
          style={{
            fontSize: 12,
            fontFamily: theme.mono,
            color: theme.success,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {fmtUSD(total)} total
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        role="img"
        aria-label="Savings trend"
        style={{ marginTop: 8 }}
      >
        <defs>
          <linearGradient id="savArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.success} stopOpacity="0.22" />
            <stop offset="100%" stopColor={theme.success} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line
            key={g}
            x1={padL}
            x2={W - padR}
            y1={padT + innerH - g * innerH}
            y2={padT + innerH - g * innerH}
            stroke={theme.border}
            strokeWidth={1}
            strokeDasharray="3 4"
          />
        ))}
        <path d={areaPath} fill="url(#savArea)" />
        <path
          d={linePath}
          fill="none"
          stroke={theme.success}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p, i) => (
          <g key={p.label}>
            <circle cx={x(i)} cy={y(p.savings)} r={3} fill={theme.surface} stroke={theme.success} strokeWidth={2} />
            {i % 4 === 0 && (
              <text
                x={x(i)}
                y={H - 6}
                fontSize={9}
                fill={theme.textTertiary}
                textAnchor="middle"
                fontFamily={theme.mono}
              >
                {p.label.split(' ')[0]}
              </text>
            )}
          </g>
        ))}
      </svg>
    </Card>
  );
}
