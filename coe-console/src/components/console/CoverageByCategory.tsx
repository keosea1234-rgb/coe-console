import { theme } from '../../styles/theme';
import { Card, CardTitle } from '../common/Card';
import type { CategoryCoverage } from '../../domain/selectors';
import { fmtUSD, fmtPct } from '../../domain/selectors';

export function CoverageByCategory({
  rows,
  onSelect,
}: {
  rows: CategoryCoverage[];
  onSelect: (category: string) => void;
}) {
  const visible = rows.filter((r) => r.addressable > 0);

  if (visible.length === 0) {
    return (
      <Card>
        <CardTitle sub="Sourced / addressable - click a bar for subcategory deep-dive">
          Spend coverage by category
        </CardTitle>
        <div style={{ padding: '32px 0', textAlign: 'center', color: theme.textTertiary, fontSize: 13 }}>
          No category data in the current filter scope.
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle sub="Sourced / addressable - click a bar for subcategory deep-dive">
        Spend coverage by category
      </CardTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 14 }}>
        {visible.map((r) => (
          <button
            key={r.category}
            type="button"
            onClick={() => onSelect(r.category)}
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(120px, 148px) 1fr 88px',
              alignItems: 'center',
              gap: 12,
              border: 'none',
              background: 'transparent',
              padding: '6px 8px',
              borderRadius: theme.radiusSm,
              textAlign: 'left',
              transition: `background ${theme.transitionFast} ${theme.easing}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.surfaceMuted;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: theme.ink,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: r.color,
                  flexShrink: 0,
                }}
              />
              {r.category}
            </span>
            <span
              style={{
                background: theme.surfaceMuted,
                borderRadius: 999,
                height: 16,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  inset: '0 auto 0 0',
                  width: `${r.coverage * 100}%`,
                  background: r.color,
                  borderRadius: 999,
                  transition: `width ${theme.transitionMedium} ${theme.easing}`,
                  opacity: 0.88,
                }}
              />
            </span>
            <span
              style={{
                fontSize: 12,
                fontFamily: theme.mono,
                color: theme.textSecondary,
                textAlign: 'right',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <b style={{ color: theme.ink }}>{fmtPct(r.coverage)}</b>
              <span style={{ display: 'block', fontSize: 10.5, color: theme.textTertiary }}>
                {fmtUSD(r.sourced)}
              </span>
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}
