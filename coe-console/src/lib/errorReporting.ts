export type ClientErrorSource = 'error-boundary' | 'window-error' | 'unhandled-rejection';

export interface ClientErrorReport {
  source: ClientErrorSource;
  message: string;
  stack?: string;
  componentStack?: string;
  route?: string;
  userAgent?: string;
  createdAt: string;
}

interface ReportContext {
  source: ClientErrorSource;
  componentStack?: string;
}

interface ReportSinkContext {
  appVersion?: string;
  actorId?: string | null;
  actorEmail?: string | null;
}

type SinkResolver = () => ReportSinkContext;

let globalReportingInstalled = false;
let sinkEnabled = false;
let sinkResolver: SinkResolver = () => ({});
// Truncation guards against runaway payloads (e.g. mega stacks from infinite loops).
const MAX_FIELD_LEN = 8000;
// Suppress recursion: if the sink itself throws we must not re-enter.
let reentryGuard = false;

export function configureErrorReportingSink(options: {
  enabled: boolean;
  resolveContext?: SinkResolver;
}) {
  sinkEnabled = options.enabled;
  if (options.resolveContext) sinkResolver = options.resolveContext;
}

export function reportClientError(error: unknown, context: ReportContext): ClientErrorReport {
  const report: ClientErrorReport = {
    source: context.source,
    ...normalizeError(error),
    componentStack: context.componentStack,
    route: typeof window === 'undefined' ? undefined : window.location.pathname,
    userAgent: typeof navigator === 'undefined' ? undefined : navigator.userAgent,
    createdAt: new Date().toISOString(),
  };

  console.error('[client-error]', report);

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent<ClientErrorReport>('coe-console:client-error', { detail: report }));
  }

  if (sinkEnabled && !reentryGuard) {
    reentryGuard = true;
    void postReport(report)
      .catch((sinkError) => {
        console.warn('[client-error] sink failed:', sinkError);
      })
      .finally(() => {
        reentryGuard = false;
      });
  }

  return report;
}

async function postReport(report: ClientErrorReport): Promise<void> {
  const ctx = sinkResolver();
  // Lazy import so test environments without Supabase env vars don't crash
  // at module load (the sink is only enabled in production anyway).
  const { supabase } = await import('./supabase');
  const { error } = await supabase.from('client_errors').insert({
    source: report.source,
    message: truncate(report.message) ?? 'Unknown client error',
    stack: truncate(report.stack),
    component_stack: truncate(report.componentStack),
    route: report.route ?? null,
    user_agent: report.userAgent ?? null,
    app_version: ctx.appVersion ?? null,
    actor_id: ctx.actorId ?? null,
    actor_email: ctx.actorEmail ?? null,
  });
  if (error) throw error;
}

function truncate(value: string | undefined | null): string | null {
  if (!value) return null;
  return value.length > MAX_FIELD_LEN ? value.slice(0, MAX_FIELD_LEN) : value;
}

export function installGlobalErrorReporting() {
  if (typeof window === 'undefined' || globalReportingInstalled) return;
  globalReportingInstalled = true;

  window.addEventListener('error', (event) => {
    reportClientError(event.error ?? event.message, { source: 'window-error' });
  });

  window.addEventListener('unhandledrejection', (event) => {
    reportClientError(event.reason, { source: 'unhandled-rejection' });
  });
}

function normalizeError(error: unknown): Pick<ClientErrorReport, 'message' | 'stack'> {
  if (error instanceof Error) {
    return {
      message: error.message || error.name,
      stack: error.stack,
    };
  }

  if (typeof error === 'string') return { message: error };

  try {
    return { message: JSON.stringify(error) ?? String(error) };
  } catch {
    return { message: 'Unknown client error' };
  }
}
