import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../domain/store';
import { useSession } from '../domain/session';
import {
  applyFilters,
  computeTotals,
  coverageByCategory,
  regionPerformance,
  pipelineByStatus,
  savingsTrend,
  buildInsights,
  coverageMatrix,
  regionCoverageDetail,
  deepDive,
  myRequestEvents,
  type DeepDive,
} from '../domain/selectors';
import { REGIONS } from '../domain/constants';
import { theme } from '../styles/theme';

import { TopBar, type ConsoleTab } from '../components/console/TopBar';
import { FilterBar } from '../components/console/FilterBar';
import { KpiRow } from '../components/console/KpiRow';
import { InsightsStrip } from '../components/console/InsightsStrip';
import { CoverageByCategory } from '../components/console/CoverageByCategory';
import { SavingsTrendChart } from '../components/console/SavingsTrendChart';
import { RegionPerformance } from '../components/console/RegionPerformance';
import { PipelineFunnel } from '../components/console/PipelineFunnel';
import { EventTimeline } from '../components/console/EventTimeline';
import { EventRegisterTable } from '../components/console/EventRegisterTable';
import { CoverageMatrix } from '../components/console/CoverageMatrix';
import { CoverageMapView } from '../components/console/CoverageMapView';
import { SpendBaselineGrid } from '../components/console/SpendBaselineGrid';
import { SubcategoryDeepDive } from '../components/console/SubcategoryDeepDive';
import { WeeklyReports } from '../components/console/WeeklyReports';
import { RequestInbox } from '../components/console/RequestInbox';
import { MyRequests } from '../components/console/MyRequests';

export function ConsolePage() {
  const { events, filters, baseline, loading, error, clearError } = useStore();
  const user = useSession((s) => s.user);
  const isAdmin = user?.role === 'admin';
  const [tab, setTab] = useState<ConsoleTab>('exec');
  const [reportsOpen, setReportsOpen] = useState(false);
  const [dive, setDive] = useState<DeepDive | null>(null);

  // If a user lands on an admin-only tab (e.g., after sign-out/in), bounce them back.
  useEffect(() => {
    if (!isAdmin && (tab === 'spend' || tab === 'inbox')) setTab('exec');
    if (isAdmin && tab === 'myRequests') setTab('exec');
  }, [isAdmin, tab]);

  // Auto-dismiss transient mutation errors so the banner doesn't linger.
  useEffect(() => {
    if (!error) return;
    const t = window.setTimeout(() => clearError(), 6000);
    return () => window.clearTimeout(t);
  }, [error, clearError]);

  const filtered = useMemo(() => applyFilters(events, filters), [events, filters]);
  const totals = useMemo(() => computeTotals(filtered, filters, baseline), [filtered, filters, baseline]);
  const catCoverage = useMemo(() => coverageByCategory(filtered, filters, baseline), [filtered, filters, baseline]);
  const regionPerf = useMemo(() => regionPerformance(filtered, filters, baseline), [filtered, filters, baseline]);
  const pipeline = useMemo(() => pipelineByStatus(filtered), [filtered]);
  const trend = useMemo(() => savingsTrend(filtered), [filtered]);
  const insights = useMemo(() => buildInsights(filtered, filters, baseline), [filtered, filters, baseline]);
  const matrix = useMemo(() => coverageMatrix(filtered, filters, baseline), [filtered, filters, baseline]);
  const mapRegionDetails = useMemo(
    () => REGIONS.map((region) => regionCoverageDetail(filtered, filters, baseline, region)),
    [filtered, filters, baseline],
  );
  const activeMapRegions = useMemo(
    () => (filters.regions.length ? filters.regions : REGIONS),
    [filters.regions],
  );

  const pendingRequests = useMemo(
    () =>
      events.filter(
        (e) => !e.archivedAt && !!e.requestCreatedAt && (e.status === 'Planned' || e.status === 'Live'),
      ).length,
    [events],
  );
  const myRequests = useMemo(() => myRequestEvents(events, user), [events, user]);

  const openDive = (category: string) => setDive(deepDive(category, filtered, filters, baseline));

  return (
    <div className="app-shell">
      <TopBar
        tab={tab}
        onTab={setTab}
        onReports={() => setReportsOpen(true)}
        pendingRequests={pendingRequests}
        myRequests={myRequests.length}
      />
      <FilterBar />

      <div className="app-content fade-up">
        {error && (
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '10px 14px',
              borderRadius: 8,
              background: theme.dangerBg,
              color: theme.danger,
              border: `1px solid ${theme.danger}`,
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={clearError}
              aria-label="Dismiss error"
              style={{
                border: 'none',
                background: 'transparent',
                color: theme.danger,
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: 18,
                lineHeight: 1,
                padding: 0,
              }}
            >
              ×
            </button>
          </div>
        )}

        {loading ? (
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              padding: 80,
              color: theme.textSecondary,
              fontFamily: theme.mono,
              fontSize: 13,
            }}
          >
            Loading console…
          </div>
        ) : (
          <>
            {tab !== 'coverageMap' && (
              <>
                <KpiRow totals={totals} />
                <InsightsStrip insights={insights} />
              </>
            )}

            {tab === 'exec' && (
              <>
                <div className="console-grid-2">
                  <CoverageByCategory rows={catCoverage} onSelect={openDive} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <SavingsTrendChart points={trend} />
                    <PipelineFunnel buckets={pipeline} />
                  </div>
                </div>
                <RegionPerformance rows={regionPerf} />
                <CoverageMatrix rows={matrix} onSelect={openDive} />
              </>
            )}

            {tab === 'coverageMap' && (
              <>
                <CoverageMapView regions={mapRegionDetails} activeRegions={activeMapRegions} />
                <CoverageMatrix rows={matrix} onSelect={openDive} />
              </>
            )}

            {tab === 'ops' && (
              <>
                <div className="console-grid-2">
                  <PipelineFunnel buckets={pipeline} />
                  <EventTimeline events={filtered} />
                </div>
                <EventRegisterTable events={filtered} readOnly={!isAdmin} />
                <CoverageMatrix rows={matrix} onSelect={openDive} />
              </>
            )}

            {tab === 'spend' && isAdmin && <SpendBaselineGrid />}

            {tab === 'inbox' && isAdmin && <RequestInbox events={events} />}

            {tab === 'myRequests' && !isAdmin && <MyRequests events={events} user={user} />}
          </>
        )}
      </div>

      <SubcategoryDeepDive data={dive} onClose={() => setDive(null)} />
      {isAdmin && (
        <WeeklyReports open={reportsOpen} onClose={() => setReportsOpen(false)} totals={totals} />
      )}

      <footer
        style={{
          borderTop: `1px solid ${theme.border}`,
          padding: '14px 20px',
          textAlign: 'center',
          color: theme.textTertiary,
          fontSize: 11,
          fontFamily: theme.mono,
        }}
      >
        eSourcing CoE Console - synthetic baseline data - coverage = sourced / addressable
      </footer>
    </div>
  );
}
