import { useMemo } from 'react';
import { theme } from '../../styles/theme';
import { Card, CardTitle } from '../common/Card';
import { REGIONS, FYS, type FY, type Region } from '../../domain/constants';
import { CATEGORIES } from '../../domain/categories';
import { useStore } from '../../domain/store';
import { cellAddressable, baselineKey, fmtUSD, fmtPct } from '../../domain/selectors';
import { Button } from '../common/primitives';

export function SpendBaselineGrid() {
  const { filters, events, baseline, baselineLoading, setBaselineCell, prefillBaseline, clearBaseline } = useStore();

  const fys = filters.fys.length ? filters.fys : FYS;
  const regions = filters.regions.length ? filters.regions : (REGIONS as Region[]);
  const cats = filters.categories.length
    ? CATEGORIES.filter((c) => filters.categories.includes(c.name))
    : CATEGORIES;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <CardTitle>Addressable spend baseline</CardTitle>
            <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>
              Edit the scope per FY · coverage everywhere = sourced / this baseline · saved to Supabase
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant="primary"
              onClick={prefillBaseline}
              disabled={baselineLoading}
              style={{ fontSize: 12, padding: '7px 12px' }}
            >
              Prefill from event data
            </Button>
            <Button
              variant="secondary"
              onClick={clearBaseline}
              disabled={baselineLoading}
              style={{ fontSize: 12, padding: '7px 12px' }}
            >
              Clear scope
            </Button>
          </div>
        </div>
      </Card>

      {fys.map((fy) => (
        <FyBlock
          key={fy}
          fy={fy}
          regions={regions}
          cats={cats}
          events={events}
          baseline={baseline}
          baselineLoading={baselineLoading}
          setBaselineCell={setBaselineCell}
        />
      ))}
    </div>
  );
}

function FyBlock({
  fy,
  regions,
  cats,
  baseline,
  baselineLoading,
  events,
  setBaselineCell,
}: {
  fy: FY;
  regions: Region[];
  cats: typeof CATEGORIES;
  baseline: Record<string, number>;
  baselineLoading: boolean;
  events: ReturnType<typeof useStore.getState>['events'];
  setBaselineCell: ReturnType<typeof useStore.getState>['setBaselineCell'];
}) {
  const { addressable, sourced } = useMemo(() => {
    let addr = 0;
    for (const c of cats) for (const r of regions) addr += cellAddressable(fy, c.name, r, baseline);
    const src = events
      .filter((e) => e.fy === fy && regions.includes(e.region) && cats.some((c) => c.name === e.category))
      .reduce((a, e) => a + e.sourced, 0);
    return { addressable: addr, sourced: src };
  }, [fy, regions, cats, baseline, events]);

  return (
    <Card pad={0}>
      <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <CardTitle style={{ fontFamily: theme.mono }}>{fy}</CardTitle>
        <div style={{ display: 'flex', gap: 18 }}>
          <Summary label="Addressable" value={fmtUSD(addressable)} />
          <Summary label="Sourced" value={fmtUSD(sourced)} />
          <Summary label="Coverage" value={fmtPct(addressable > 0 ? sourced / addressable : 0)} accent={theme.primary} />
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
          <thead>
            <tr>
              <th style={gh('left')}>Category</th>
              {regions.map((r) => (
                <th key={r} style={gh('right')}>
                  {r}
                </th>
              ))}
              <th style={gh('right')}>Total</th>
            </tr>
          </thead>
          <tbody>
            {cats.map((c) => {
              let rowTotal = 0;
              return (
                <tr key={c.name}>
                  <td style={gd('left')}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 3, background: c.color }} />
                      {c.name}
                    </span>
                  </td>
                  {regions.map((r) => {
                    const val = cellAddressable(fy, c.name, r, baseline);
                    rowTotal += val;
                    const manual = baseline[baselineKey(fy, c.name, r)] != null;
                    return (
                      <td key={r} style={gd('right')}>
                        <input
                          type="number"
                          value={manual ? Math.round(val) : ''}
                          placeholder={fmtUSD(val)}
                          disabled={baselineLoading}
                          onChange={(e) =>
                            setBaselineCell(fy, c.name, r, e.target.value === '' ? 0 : Number(e.target.value))
                          }
                          style={{
                            width: 96,
                            border: `1px solid ${manual ? theme.primary : theme.border}`,
                            borderRadius: 7,
                            padding: '5px 7px',
                            fontSize: 11.5,
                            fontFamily: theme.mono,
                            textAlign: 'right',
                            color: theme.ink,
                            background: manual ? theme.primaryMuted : theme.surface,
                          }}
                        />
                      </td>
                    );
                  })}
                  <td style={{ ...gd('right'), fontWeight: 700 }}>{fmtUSD(rowTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Summary({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: 10, color: theme.muted2, textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: theme.mono }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 800, fontFamily: theme.mono, color: accent ?? theme.ink }}>{value}</div>
    </div>
  );
}

const gh = (align: 'left' | 'right'): React.CSSProperties => ({
  textAlign: align,
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: '.06em',
  textTransform: 'uppercase',
  color: theme.muted2,
  fontFamily: theme.mono,
  padding: '8px 12px',
  borderBottom: `1px solid ${theme.border}`,
  borderTop: `1px solid ${theme.border}`,
});
const gd = (align: 'left' | 'right'): React.CSSProperties => ({
  textAlign: align,
  fontSize: 12.5,
  padding: '7px 12px',
  borderBottom: `1px solid ${theme.border}`,
  whiteSpace: 'nowrap',
  fontFamily: align === 'right' ? theme.mono : theme.font,
});
