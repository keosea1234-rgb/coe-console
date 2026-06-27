import { theme } from '../../styles/theme';
import { Modal } from '../common/overlays';
import { ProgressBar } from '../common/primitives';
import { IconClose } from './icons';
import type { DeepDive } from '../../domain/selectors';
import { fmtUSD, fmtPct } from '../../domain/selectors';
import { REGION_LABEL } from '../../domain/constants';

export function SubcategoryDeepDive({
  data,
  onClose,
}: {
  data: DeepDive | null;
  onClose: () => void;
}) {
  return (
    <Modal open={!!data} onClose={onClose}>
      {data && <Body data={data} onClose={onClose} />}
    </Modal>
  );
}

function Tile({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span
        style={{
          fontSize: 10,
          fontFamily: theme.mono,
          letterSpacing: '.06em',
          textTransform: 'uppercase',
          color: theme.textTertiary,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 17,
          fontWeight: 800,
          fontFamily: theme.mono,
          color: accent ?? theme.ink,
          letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Body({ data, onClose }: { data: DeepDive; onClose: () => void }) {
  return (
    <>
      <div style={{ borderTop: `3px solid ${data.color}` }}>
        <div
          style={{
            padding: '18px 22px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                fontFamily: theme.mono,
                letterSpacing: '.07em',
                textTransform: 'uppercase',
                color: theme.textTertiary,
              }}
            >
              Subcategory deep-dive
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                marginTop: 4,
                color: theme.ink,
                lineHeight: 1.25,
              }}
            >
              {data.category}
            </div>
            <div style={{ fontSize: 11, color: theme.textSecondary, marginTop: 3 }}>Scope: {data.scope}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ui-btn ui-btn--ghost"
            style={{ width: 32, height: 32, padding: 0 }}
          >
            <IconClose size={15} />
          </button>
        </div>
        <div
          style={{
            padding: '0 22px 18px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 14,
          }}
        >
          <Tile label="Addressable" value={fmtUSD(data.addressable)} />
          <Tile label="Sourced" value={fmtUSD(data.sourced)} />
          <Tile label="Coverage" value={fmtPct(data.coverage)} accent={theme.primary} />
          <Tile label="Untapped gap" value={fmtUSD(data.untapped)} accent={theme.warning} />
          <Tile label="Events" value={String(data.events)} />
        </div>
      </div>

      <div
        style={{
          margin: '0 22px',
          background: theme.surfaceMuted,
          border: `1px solid ${theme.border}`,
          borderRadius: theme.radiusSm,
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontFamily: theme.mono,
            letterSpacing: '.06em',
            textTransform: 'uppercase',
            color: theme.textTertiary,
          }}
        >
          Where to focus first
        </span>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: theme.ink }}>{data.focus}</span>
        <span style={{ fontSize: 12, color: theme.textSecondary }}>
          - largest untapped opportunity in this category.
        </span>
      </div>

      <div style={{ padding: '16px 22px 22px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead>
            <tr>
              <th style={dh('left', 28)}>#</th>
              <th style={dh('left')}>Subcategory</th>
              <th style={dh('left', 150)}>Coverage</th>
              <th style={dh('right')}>Addressable</th>
              <th style={dh('right')}>Sourced</th>
              <th style={dh('right')}>Savings</th>
              <th style={dh('right')}>Events</th>
              <th style={dh('right')}>Auction %</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.flatMap((r, i) => {
              const tag =
                r.coverage < 0.3 ? 'Low coverage' : r.untapped > data.untapped * 0.25 ? 'Large gap' : '';
              const subcategoryRow = (
                <tr
                  key={r.subcategory}
                  style={{
                    background: 'rgba(252, 247, 238, 0.85)',
                    transition: `background ${theme.transitionFast} ${theme.easing}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = theme.surfaceMuted;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(252, 247, 238, 0.85)';
                  }}
                >
                  <td style={dd('left')}>{i + 1}</td>
                  <td style={dd('left')}>
                    <div style={{ fontWeight: 600 }}>{r.subcategory}</div>
                    {tag && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: tag === 'Low coverage' ? theme.warning : theme.chart5,
                          fontFamily: theme.mono,
                        }}
                      >
                        {tag}
                      </span>
                    )}
                  </td>
                  <td style={dd('left')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <ProgressBar value={r.coverage} color={data.color} height={5} />
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontFamily: theme.mono,
                          fontWeight: 700,
                          width: 36,
                          textAlign: 'right',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {fmtPct(r.coverage)}
                      </span>
                    </div>
                  </td>
                  <td style={dnum}>{fmtUSD(r.addressable)}</td>
                  <td style={dnum}>{fmtUSD(r.sourced)}</td>
                  <td style={{ ...dnum, color: r.savings > 0 ? theme.success : theme.textTertiary }}>
                    {r.savings > 0 ? fmtUSD(r.savings) : '-'}
                  </td>
                  <td style={dnum}>{r.events} evt</td>
                  <td style={dnum}>{fmtPct(r.auctionShare)}</td>
                </tr>
              );
              const regionRows = r.regionRows.map((regionRow) => (
                <tr
                  key={`${r.subcategory}-${regionRow.region}`}
                  style={{ transition: `background ${theme.transitionFast} ${theme.easing}` }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = theme.surfaceMuted;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <td style={dd('left')} />
                  <td style={dd('left')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 14 }}>
                      <span
                        style={{
                          minWidth: 42,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: regionBadge(regionRow.region),
                          color: '#fff',
                          fontSize: 10,
                          fontWeight: 800,
                          fontFamily: theme.mono,
                          textAlign: 'center',
                        }}
                      >
                        {regionRow.region}
                      </span>
                      <span style={{ color: theme.textSecondary }}>{REGION_LABEL[regionRow.region]}</span>
                    </div>
                  </td>
                  <td style={dd('left')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <ProgressBar value={regionRow.coverage} color={regionCoverageColor(regionRow.coverage)} height={5} />
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontFamily: theme.mono,
                          fontWeight: 700,
                          width: 36,
                          textAlign: 'right',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {fmtPct(regionRow.coverage)}
                      </span>
                    </div>
                  </td>
                  <td style={dnum}>{fmtUSD(regionRow.addressable)}</td>
                  <td style={dnum}>{fmtUSD(regionRow.sourced)}</td>
                  <td style={{ ...dnum, color: regionRow.savings > 0 ? theme.success : theme.textTertiary }}>
                    {regionRow.savings > 0 ? fmtUSD(regionRow.savings) : '-'}
                  </td>
                  <td style={dnum}>{regionRow.events} evt</td>
                  <td style={dnum}>{regionRow.sourced > 0 ? fmtPct(regionRow.auctionShare) : '-'}</td>
                </tr>
              ));
              return [subcategoryRow, ...regionRows];
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function regionBadge(region: string): string {
  if (region === 'NA') return theme.chart4;
  if (region === 'EMEA') return theme.warning;
  if (region === 'APAC') return theme.primary;
  return theme.chart5;
}

function regionCoverageColor(coverage: number): string {
  if (coverage <= 0) return theme.borderStrong;
  if (coverage < 0.3) return theme.warning;
  return theme.success;
}

const dh = (align: 'left' | 'right', width?: number): React.CSSProperties => ({
  textAlign: align,
  width,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '.06em',
  textTransform: 'uppercase',
  color: theme.textTertiary,
  fontFamily: theme.mono,
  padding: '8px 10px',
  borderBottom: `1px solid ${theme.border}`,
});
const dd = (align: 'left' | 'right'): React.CSSProperties => ({
  textAlign: align,
  fontSize: 12.5,
  padding: '10px 10px',
  borderBottom: `1px solid ${theme.border}`,
  verticalAlign: 'middle',
});
const dnum: React.CSSProperties = {
  ...dd('right'),
  fontFamily: theme.mono,
  fontVariantNumeric: 'tabular-nums',
};
