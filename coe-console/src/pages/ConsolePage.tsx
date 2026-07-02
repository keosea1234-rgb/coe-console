import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../domain/store';
import { useSession } from '../domain/session';
import { hasPermission } from '../domain/authz';
import { isDemoModeEnabled, listDashboardSummary } from '../domain/repository';
import {
  applyFilters,
  computeTotals,
  totalsFromDashboardSummary,
  coverageByCategory,
  regionPerformance,
  pipelineByStatus,
  savingsTrend,
  buildInsights,
  coverageMatrix,
  regionCoverageDetail,
  deepDive,
  myRequestEvents,
  type DashboardSummary,
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
import { TemplatesLearningTab } from '../components/console/TemplatesLearningTab';
import { ClientErrorLog } from '../components/console/ClientErrorLog';

export function ConsolePage() {
  const { events, filters, baseline, loading, error, clearError } = useStore();
  const user = useSession((s) => s.user);
  const canViewOwnRequests = hasPermission(user, 'request:view_own');
  const canViewRequestInbox = hasPermission(user, 'request:view_all');
  const canUpdateEventStatus = hasPermission(user, 'event:update_status');
  const canAdminEvents = hasPermission(user, 'event:admin');
  const canRequestFeedback = hasPermission(user, 'feedback:request');
  const canViewErrors = hasPermission(user, 'admin:audit');
  const demoMode = isDemoModeEnabled();
  const [tab, setTab] = useState<ConsoleTab>('exec');
  const [reportsOpen, setReportsOpen] = useState(false);
  const [dive, setDive] = useState<DeepDive | null>(null);
  const [dashboardSummaryState, setDashboardSummaryState] = useState<{
    key: string;
    summary: DashboardSummary;
    loadedAt: string;
  } | null>(null);

  // If permissions change after sign-out/in, bounce away from tabs the user can no longer access.
  useEffect(() => {
    if ((!canAdminEvents && tab === 'spend') || (!canViewRequestInbox && tab === 'inbox')) setTab('exec');
    if (!canViewErrors && tab === 'errors') setTab('exec');
    if (!canViewOwnRequests && tab === 'myRequests') setTab('exec');
  }, [canAdminEvents, canViewErrors, canViewOwnRequests, canViewRequestInbox, tab]);

  // Auto-dismiss transient mutation errors so the banner doesn't linger.
  useEffect(() => {
    if (!error) return;
    const t = window.setTimeout(() => clearError(), 6000);
    return () => window.clearTimeout(t);
  }, [error, clearError]);

  const summaryKey = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    if (demoMode) {
      setDashboardSummaryState(null);
      return;
    }

    let active = true;
    setDashboardSummaryState((current) => (current?.key === summaryKey ? current : null));

    void listDashboardSummary(filters)
      .then((summary) => {
        if (active) setDashboardSummaryState({ key: summaryKey, summary, loadedAt: new Date().toISOString() });
      })
      .catch((err) => {
        console.warn('[dashboard] server summary unavailable; falling back to client selectors', err);
        if (active) setDashboardSummaryState(null);
      });

    return () => {
      active = false;
    };
  }, [demoMode, filters, summaryKey]);

  const dashboardSummary =
    !demoMode && dashboardSummaryState?.key === summaryKey ? dashboardSummaryState.summary : null;
  const freshness = dashboardSummary
    ? { label: 'Supabase dashboard summary', loadedAt: dashboardSummaryState?.loadedAt }
    : { label: demoMode ? 'Demo dataset' : 'Client-calculated fallback', loadedAt: new Date().toISOString() };

  const filtered = useMemo(() => applyFilters(events, filters), [events, filters]);
  const clientTotals = useMemo(() => computeTotals(filtered, filters, baseline), [filtered, filters, baseline]);
  const totals = useMemo(
    () =>
      dashboardSummary
        ? totalsFromDashboardSummary(dashboardSummary, clientTotals)
        : clientTotals,
    [dashboardSummary, clientTotals],
  );
  const catCoverage = useMemo(() => coverageByCategory(filtered, filters, baseline), [filtered, filters, baseline]);
  const regionPerf = useMemo(() => regionPerformance(filtered, filters, baseline), [filtered, filters, baseline]);
  const pipeline = useMemo(
    () => dashboardSummary?.statusBuckets ?? pipelineByStatus(filtered),
    [dashboardSummary, filtered],
  );
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
      {tab !== 'templatesLearning' && tab !== 'errors' && <FilterBar summary={totals} />}

      <div className="app-content fade-up">
        {tab !== 'templatesLearning' && tab !== 'errors' && <DataFreshnessIndicator {...freshness} />}
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

        {loading && tab !== 'templatesLearning' && tab !== 'errors' ? (
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
            {tab === 'exec' && (
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
                <EventRegisterTable
                  events={filtered}
                  canUpdateStatus={canUpdateEventStatus}
                  canRequestFeedback={canRequestFeedback}
                  canDeleteRequests={canAdminEvents}
                />
                <CoverageMatrix rows={matrix} onSelect={openDive} />
              </>
            )}

            {tab === 'spend' && canAdminEvents && <SpendBaselineGrid />}

            {tab === 'inbox' && canViewRequestInbox && <RequestInbox events={events} />}

            {tab === 'myRequests' && canViewOwnRequests && <MyRequests events={events} user={user} />}

            {tab === 'templatesLearning' && <TemplatesLearningTab />}

            {tab === 'errors' && canViewErrors && <ClientErrorLog />}
          </>
        )}
      </div>

      <SubcategoryDeepDive data={dive} onClose={() => setDive(null)} />
      {canAdminEvents && (
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
        eSourcing CoE Console - coverage = sourced / addressable
        {demoMode ? ' - demo data mode enabled' : ''}
      </footer>
    </div>
  );
}

function DataFreshnessIndicator({ label, loadedAt }: { label: string; loadedAt?: string }) {
  const timestamp = loadedAt ? new Date(loadedAt) : null;
  const display = timestamp && !Number.isNaN(timestamp.getTime())
    ? timestamp.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'refreshing';

  return (
    <div
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
        color: theme.textSecondary,
        fontSize: 11.5,
        fontFamily: theme.mono,
      }}
    >
      <span>
        Data source: <strong style={{ color: theme.ink }}>{label}</strong>
      </span>
      <span>
        Last refreshed: <strong style={{ color: theme.ink }}>{display}</strong>
      </span>
    </div>
  );
}
