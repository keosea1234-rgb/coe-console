import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { REGION_LABEL, type Region } from '../../domain/constants';
import type { RegionCategoryCoverage, RegionCoverageDetail } from '../../domain/selectors';
import { fmtPct, fmtUSD } from '../../domain/selectors';
import { numeric, sectionLabel, theme } from '../../styles/theme';
import { Card, CardTitle } from '../common/Card';
import { ProgressBar } from '../common/primitives';
import { COVERAGE_RAMP } from './coverageColors';
import {
  REGION_ANCHORS,
  WORLD_COUNTRIES,
  WORLD_H,
  WORLD_LAND,
  WORLD_W,
  projectLat,
  projectLng,
} from '../../domain/worldGeo';

// Coverage ramp mirrors the matrix format: low values read warm, high values
// move into green.
const RAMP: [number, string][] = [
  ...COVERAGE_RAMP,
];
const NO_DATA = '#c7d2e3';
const NEUTRAL_LAND = '#d3ddec'; // land outside the four coverage regions
const LAND_BASE = '#d7e3f4'; // silhouette fill behind the choropleth
const LAND_BORDER = 'rgba(255,255,255,.72)';

function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const c = (sh: number) =>
    Math.round(((pa >> sh) & 255) + (((pb >> sh) & 255) - ((pa >> sh) & 255)) * t);
  return `rgb(${c(16)},${c(8)},${c(0)})`;
}

function coverageColor(v: number): string {
  if (v <= 0) return RAMP[0][1];
  for (let i = 1; i < RAMP.length; i++) {
    if (v <= RAMP[i][0]) {
      const [p0, c0] = RAMP[i - 1];
      const [p1, c1] = RAMP[i];
      return mix(c0, c1, (v - p0) / (p1 - p0));
    }
  }
  return RAMP[RAMP.length - 1][1];
}

// Hand-tuned [lon, lat] so each region's pill lands on the heart of its landmass.
const PILL_ANCHOR: Record<Region, [number, number]> = {
  NA: [-97, 47],
  EMEA: [18, 48],
  APAC: [103, 36],
  LATAM: [-58, -12],
};

const FULL_VIEW = { scale: 1, fx: WORLD_W / 2, fy: WORLD_H / 2 };
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function CoverageMapView({
  regions,
  activeRegions,
}: {
  regions: RegionCoverageDetail[];
  activeRegions: Region[];
}) {
  const [selected, setSelected] = useState<Region>('EMEA');
  const [hovered, setHovered] = useState<Region | null>(null);
  const [view, setView] = useState(FULL_VIEW);
  const [tip, setTip] = useState<{ x: number; y: number; region: Region } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const regionById = useMemo(
    () => new Map(regions.map((region) => [region.region, region] as const)),
    [regions],
  );
  const activeSet = useMemo(() => new Set(activeRegions), [activeRegions]);
  const preferredRegion = useMemo(() => {
    const activeDetails = activeRegions.map((region) => regionById.get(region)).filter(Boolean);
    return (
      activeDetails.sort((a, b) => (b?.coverage ?? 0) - (a?.coverage ?? 0))[0]?.region ??
      activeRegions[0] ??
      'EMEA'
    );
  }, [activeRegions, regionById]);

  useEffect(() => {
    if (!activeSet.has(selected)) setSelected(preferredRegion);
  }, [activeSet, preferredRegion, selected]);

  const selectedDetail = regionById.get(selected) ?? regionById.get(preferredRegion) ?? regions[0];
  const selectedRegion = selectedDetail?.region;
  const regionSummary = [...regions].sort((a, b) => b.coverage - a.coverage);

  // Global roll-up across the regions currently in filter scope.
  const summary = useMemo(() => {
    const scoped = regions.filter((r) => activeSet.has(r.region));
    const addressable = scoped.reduce((s, r) => s + r.addressable, 0);
    const sourced = scoped.reduce((s, r) => s + r.sourced, 0);
    const untapped = scoped.reduce((s, r) => s + r.untapped, 0);
    const leader = [...scoped].sort((a, b) => b.coverage - a.coverage)[0];
    return {
      addressable,
      sourced,
      untapped,
      coverage: addressable > 0 ? sourced / addressable : 0,
      inScope: scoped.length,
      leader,
    };
  }, [regions, activeSet]);

  // Land silhouette (base fill + faint coastline). Geometry-only, so memoize
  // once — it never re-renders on hover/select.
  const staticLayer = useMemo(
    () => (
      <path
        d={WORLD_LAND}
        fill={LAND_BASE}
        stroke="rgba(30,58,138,.25)"
        strokeWidth={0.6}
        vectorEffect="non-scaling-stroke"
      />
    ),
    [],
  );

  const tx = WORLD_W / 2 - view.fx * view.scale;
  const ty = WORLD_H / 2 - view.fy * view.scale;
  const toScreen = (x: number, y: number) => ({
    left: `${((tx + x * view.scale) / WORLD_W) * 100}%`,
    top: `${((ty + y * view.scale) / WORLD_H) * 100}%`,
  });

  const focusRegion = useCallback(
    (region: Region) => {
      if (!activeSet.has(region)) return;
      setSelected(region);
      const a = REGION_ANCHORS[region];
      setView({ scale: 1.95, fx: a.x, fy: a.y });
    },
    [activeSet],
  );
  const pickRegion = (region: Region) => {
    setSelected(region);
    setView(FULL_VIEW);
  };

  // Choropleth fills — depend only on data, so hover/select never recompute them.
  const countryLayer = useMemo(
    () =>
      WORLD_COUNTRIES.map((country, i) => {
        const region = country.region;
        const inScope = !!region && activeSet.has(region);
        const detail = region ? regionById.get(region) : undefined;
        let fill = NEUTRAL_LAND;
        if (region) {
          fill = !inScope
            ? '#dbe3f0'
            : detail && detail.addressable > 0
              ? coverageColor(detail.coverage)
              : NO_DATA;
        }
        return (
          <path
            key={i}
            d={country.d}
            fill={fill}
            fillRule="evenodd"
            stroke={LAND_BORDER}
            strokeWidth={0.5}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            onMouseEnter={
              inScope && region
                ? () => {
                    setHovered(region);
                    setTip((t) => ({ x: t?.x ?? 0, y: t?.y ?? 0, region }));
                  }
                : undefined
            }
            onClick={region ? () => focusRegion(region) : undefined}
            style={{
              cursor: inScope ? 'pointer' : 'default',
              opacity: region && !inScope ? 0.55 : 1,
            }}
            aria-hidden
          />
        );
      }),
    [regionById, activeSet, focusRegion],
  );
  const zoomBy = (factor: number) =>
    setView((v) => {
      const scale = clamp(v.scale * factor, 1, 4.5);
      return scale <= 1.001 ? FULL_VIEW : { ...v, scale };
    });

  const onCanvasMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = canvasRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setTip((t) => (t ? { ...t, x: e.clientX - r.left, y: e.clientY - r.top } : t));
  };

  return (
    <div className="coverage-page fade-up">
      <div className="coverage-stat-strip">
        <StatTile label="Global coverage" value={fmtPct(summary.coverage)} accent={theme.primary}>
          <div style={{ marginTop: 9 }}>
            <ProgressBar value={summary.coverage} color={theme.primary} height={6} />
          </div>
        </StatTile>
        <StatTile
          label="Sourced spend"
          value={fmtUSD(summary.sourced)}
          sub={`of ${fmtUSD(summary.addressable)} addressable`}
        />
        <StatTile
          label="Untapped opportunity"
          value={fmtUSD(summary.untapped)}
          accent={theme.warning}
          sub={`across ${summary.inScope} region${summary.inScope === 1 ? '' : 's'} in scope`}
        />
        <StatTile
          label="Coverage leader"
          value={summary.leader ? REGION_LABEL[summary.leader.region] : '-'}
          accent={theme.success}
          sub={summary.leader ? `${fmtPct(summary.leader.coverage)} sourced` : undefined}
        />
      </div>

      <Card pad={0}>
        <div className="coverage-hero-head">
          <CardTitle sub="Spend coverage by region across the current filter scope. Select a region to inspect category and subcategory depth.">
            Coverage map
          </CardTitle>
          <div className="coverage-zoom">
            <ZoomButton label="Zoom in" onClick={() => zoomBy(1.5)}>
              <PlusIcon />
            </ZoomButton>
            <ZoomButton label="Zoom out" onClick={() => zoomBy(1 / 1.5)}>
              <MinusIcon />
            </ZoomButton>
            <ZoomButton label="Reset view" onClick={() => setView(FULL_VIEW)} wide>
              <ResetIcon />
            </ZoomButton>
          </div>
        </div>

        <div className="coverage-map-grid">
          <section className="coverage-map-main" aria-label="Coverage map by region">
            <div
              className="coverage-map-canvas"
              ref={canvasRef}
              onMouseMove={onCanvasMove}
              onMouseLeave={() => {
                setHovered(null);
                setTip(null);
              }}
            >
              <svg
                viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
                role="img"
                aria-label="World map shaded by regional spend coverage"
                preserveAspectRatio="xMidYMid slice"
              >
                <defs>
                  <linearGradient id="cm-ocean" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#f3f8ff" />
                    <stop offset="1" stopColor="#e4edf8" />
                  </linearGradient>
                  <radialGradient id="cm-vignette" cx="0.5" cy="0.42" r="0.78">
                    <stop offset="0.66" stopColor="#000000" stopOpacity="0" />
                    <stop offset="1" stopColor="#1e3a8a" stopOpacity="0.07" />
                  </radialGradient>
                </defs>

                <rect x="0" y="0" width={WORLD_W} height={WORLD_H} fill="url(#cm-ocean)" />

                <g
                  transform={`translate(${tx} ${ty}) scale(${view.scale})`}
                  style={{ transition: `transform 600ms ${theme.easing}` }}
                >
                  {staticLayer}
                  {countryLayer}

                  {/* Hover emphasis (skip if it's already the selected region). */}
                  {hovered &&
                    hovered !== selectedRegion &&
                    activeSet.has(hovered) &&
                    WORLD_COUNTRIES.filter((c) => c.region === hovered).map((country, i) => (
                      <path
                        key={`hov-${i}`}
                        d={country.d}
                        fill="none"
                        stroke="rgba(30,58,138,.55)"
                        strokeWidth={1}
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                        pointerEvents="none"
                      />
                    ))}

                  {/* Re-stroke the selected region on top so its outline is never clipped by neighbours. */}
                  {selectedRegion &&
                    activeSet.has(selectedRegion) &&
                    WORLD_COUNTRIES.filter((c) => c.region === selectedRegion).map((country, i) => (
                      <path
                        key={`sel-${i}`}
                        d={country.d}
                        fill="none"
                        stroke={theme.primary}
                        strokeWidth={1.5}
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                        pointerEvents="none"
                      />
                    ))}
                </g>

                <rect
                  x="0"
                  y="0"
                  width={WORLD_W}
                  height={WORLD_H}
                  fill="url(#cm-vignette)"
                  pointerEvents="none"
                />
              </svg>

              {/* HTML overlay pills — crisp at any zoom, positioned from the live transform. */}
              {regionSummary
                .filter((r) => activeSet.has(r.region))
                .map((r) => {
                  const [lon, lat] = PILL_ANCHOR[r.region];
                  const pos = toScreen(projectLng(lon), projectLat(lat));
                  const active = r.region === selectedRegion;
                  const hot = r.region === hovered;
                  return (
                    <button
                      key={r.region}
                      type="button"
                      className={`coverage-pill${active ? ' is-active' : ''}`}
                      style={{ left: pos.left, top: pos.top, zIndex: active || hot ? 6 : 4 }}
                      onClick={() => focusRegion(r.region)}
                      onMouseEnter={() => setHovered(r.region)}
                    >
                      <span
                        className="coverage-pill-dot"
                        style={{ background: coverageColor(r.coverage) }}
                      />
                      <span className="coverage-pill-name">{r.region}</span>
                      <span className="coverage-pill-pct">{fmtPct(r.coverage)}</span>
                    </button>
                  );
                })}

              {tip &&
                (() => {
                  const d = regionById.get(tip.region);
                  if (!d) return null;
                  return (
                    <div
                      className="coverage-tip"
                      style={{ left: tip.x, top: tip.y }}
                      role="tooltip"
                    >
                      <div className="coverage-tip-head">
                        <span
                          className="coverage-pill-dot"
                          style={{ background: coverageColor(d.coverage) }}
                        />
                        {REGION_LABEL[tip.region]}
                      </div>
                      <div className="coverage-tip-cov" style={numeric}>
                        {fmtPct(d.coverage)} <span>coverage</span>
                      </div>
                      <div className="coverage-tip-rows">
                        <span>Sourced</span>
                        <b style={numeric}>{fmtUSD(d.sourced)}</b>
                        <span>Addressable</span>
                        <b style={numeric}>{fmtUSD(d.addressable)}</b>
                        <span>Untapped</span>
                        <b style={{ ...numeric, color: theme.warning }}>{fmtUSD(d.untapped)}</b>
                      </div>
                    </div>
                  );
                })()}
            </div>

            <div className="coverage-legend">
              <span style={sectionLabel}>Coverage</span>
              <div className="coverage-legend-bar">
                <span
                  className="coverage-legend-grad"
                  style={{
                    background: `linear-gradient(90deg, ${RAMP.map(([s, c]) => `${c} ${s * 100}%`).join(', ')})`,
                  }}
                />
                <div className="coverage-legend-ticks" style={numeric}>
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
              <span className="coverage-legend-nodata">
                <span style={{ background: NO_DATA }} /> No data in scope
              </span>
            </div>

            <div className="coverage-region-strip">
              {regionSummary.map((region) => {
                const active = region.region === selectedRegion;
                const disabled = !activeSet.has(region.region);
                return (
                  <button
                    key={region.region}
                    type="button"
                    disabled={disabled}
                    onClick={() => pickRegion(region.region)}
                    onMouseEnter={() => !disabled && setHovered(region.region)}
                    onMouseLeave={() => setHovered(null)}
                    className={`coverage-region-card${active ? ' is-active' : ''}`}
                  >
                    <div className="coverage-region-card-top">
                      <span className="coverage-region-card-name">
                        {REGION_LABEL[region.region]}
                      </span>
                      <span className="coverage-region-card-pct" style={numeric}>
                        {disabled ? '-' : fmtPct(region.coverage)}
                      </span>
                    </div>
                    <ProgressBar
                      value={disabled ? 0 : region.coverage}
                      color={coverageColor(region.coverage)}
                      height={5}
                    />
                    <div className="coverage-region-card-foot" style={numeric}>
                      <span>{fmtUSD(region.sourced)}</span>
                      <span>{region.events} events</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {selectedDetail && <RegionBreakdownPanel detail={selectedDetail} />}
        </div>
      </Card>
    </div>
  );
}

function RegionBreakdownPanel({ detail }: { detail: RegionCoverageDetail }) {
  const coverageRows = [...detail.categoryRows]
    .filter((row) => row.addressable > 0)
    .sort((a, b) => b.coverage - a.coverage)
    .slice(0, 8);
  const gapRows = detail.categoryRows.filter((row) => row.untapped > 0).slice(0, 5);
  const accent = coverageColor(detail.coverage);

  return (
    <aside
      className="coverage-detail-panel"
      aria-label={`${REGION_LABEL[detail.region]} coverage breakdown`}
    >
      <div className="coverage-detail-header">
        <CoverageRing value={detail.coverage} color={accent} />
        <div style={{ minWidth: 0 }}>
          <div style={sectionLabel}>Selected region</div>
          <h2 className="coverage-detail-title">{REGION_LABEL[detail.region]}</h2>
          <div className="coverage-detail-scope">{detail.scope}</div>
        </div>
      </div>

      <div className="coverage-detail-metrics">
        <Metric label="Sourced" value={fmtUSD(detail.sourced)} />
        <Metric label="Addressable" value={fmtUSD(detail.addressable)} />
        <Metric label="Events" value={String(detail.events)} />
        <Metric label="Untapped gap" value={fmtUSD(detail.untapped)} accent={theme.warning} />
      </div>

      <div className="coverage-focus">
        <div style={sectionLabel}>Priority focus area</div>
        <div className="coverage-focus-row">
          <strong>{detail.topGapCategory}</strong>
          <span>{detail.topGapSubcategory}</span>
        </div>
      </div>

      <section>
        <div style={{ ...sectionLabel, marginBottom: 9 }}>Coverage by category</div>
        {coverageRows.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {coverageRows.map((row) => (
              <CategoryCoverageRow key={row.category} row={row} />
            ))}
          </div>
        ) : (
          <EmptyRegionMessage />
        )}
      </section>

      <section>
        <div style={{ ...sectionLabel, marginBottom: 9 }}>Largest category gaps</div>
        {gapRows.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {gapRows.map((row) => (
              <GapBlock key={row.category} row={row} />
            ))}
          </div>
        ) : (
          <EmptyRegionMessage />
        )}
      </section>
    </aside>
  );
}

function CategoryCoverageRow({ row }: { row: RegionCategoryCoverage }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(96px, 132px) 1fr 44px', gap: 10, alignItems: 'center' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: theme.ink, minWidth: 0 }}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: row.color, flexShrink: 0 }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.category}</span>
      </span>
      <ProgressBar value={row.coverage} color={row.color} height={6} />
      <span style={{ ...numeric, fontSize: 11.5, fontWeight: 700, color: theme.ink, textAlign: 'right' }}>
        {fmtPct(row.coverage)}
      </span>
    </div>
  );
}

function GapBlock({ row }: { row: RegionCategoryCoverage }) {
  const subRows = row.subcategories.filter((sub) => sub.addressable > 0).slice(0, 3);

  return (
    <div className="coverage-gap-block">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 700, color: theme.ink }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: row.color }} />
          {row.category}
        </span>
        <span style={{ ...numeric, fontSize: 11, color: theme.warning, fontWeight: 700 }}>
          {fmtUSD(row.untapped)}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 9 }}>
        {subRows.map((sub) => (
          <div key={sub.subcategory} style={{ display: 'grid', gridTemplateColumns: '1fr 56px 46px', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11.5, color: theme.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {sub.subcategory}
            </span>
            <ProgressBar value={sub.coverage} color={sub.coverage < 0.5 ? theme.warning : row.color} height={5} />
            <span style={{ ...numeric, fontSize: 10.5, textAlign: 'right', color: theme.textSecondary }}>
              {fmtPct(sub.coverage)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CoverageRing({ value, color }: { value: number; color: string }) {
  const size = 66;
  const sw = 7;
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - clamp(value, 0, 1));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={theme.surfaceMuted} strokeWidth={sw} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={off}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: `stroke-dashoffset ${theme.transitionMedium} ${theme.easing}, stroke ${theme.transitionMedium} ${theme.easing}` }}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ ...numeric, fontSize: 15, fontWeight: 800, fill: theme.ink }}
      >
        {fmtPct(value)}
      </text>
    </svg>
  );
}

function StatTile({
  label,
  value,
  sub,
  accent,
  children,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="coverage-stat">
      <div style={sectionLabel}>{label}</div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: 0,
          color: accent ?? theme.ink,
          lineHeight: 1.15,
          marginTop: 6,
          ...numeric,
        }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: 11.5, color: theme.textSecondary, marginTop: 5, ...numeric }}>{sub}</div>}
      {children}
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <div style={metricLabel}>{label}</div>
      <div style={{ ...numeric, fontSize: 16, fontWeight: 800, color: accent ?? theme.ink, marginTop: 3 }}>
        {value}
      </div>
    </div>
  );
}

function ZoomButton({
  label,
  onClick,
  children,
  wide,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="coverage-zoom-btn"
      style={{ width: wide ? 38 : 32 }}
    >
      {children}
    </button>
  );
}

function EmptyRegionMessage() {
  return <div className="coverage-empty">No coverage data in this filter scope.</div>;
}

const iconProps = {
  width: 14,
  height: 14,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};
const PlusIcon = () => (
  <svg {...iconProps}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const MinusIcon = () => (
  <svg {...iconProps}>
    <path d="M5 12h14" />
  </svg>
);
const ResetIcon = () => (
  <svg {...iconProps} width={15} height={15}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 4v4h4" />
  </svg>
);

const metricLabel: CSSProperties = {
  fontSize: 10,
  fontFamily: theme.mono,
  letterSpacing: '.06em',
  textTransform: 'uppercase',
  color: theme.textTertiary,
  lineHeight: 1.2,
};
