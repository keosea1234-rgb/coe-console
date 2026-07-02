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
const recentReports = new Map<string, number>();
const DEDUPE_WINDOW_MS = 15_000;

const REDACTION_RULES: Array<[RegExp, string]> = [
  [/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[redacted-email]'],
  [/\b(password|passwd|pwd|token|access_token|refresh_token|api[_-]?key|secret|authorization)\b\s*[:=]\s*["']?[^"',\s}]+/gi, '$1=[redacted]'],
  [/\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi, 'Bearer [redacted]'],
  [/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[redacted-jwt]'],
  [/\b(?:sk|pk|sbp|sb_secret|ghp|github_pat)_[A-Za-z0-9_]{12,}\b/g, '[redacted-token]'],
];

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
    componentStack: sanitizeForErrorReport(context.componentStack) ?? undefined,
    route: sanitizeRoute(typeof window === 'undefined' ? undefined : window.location.pathname),
    userAgent: truncate(typeof navigator === 'undefined' ? undefined : navigator.userAgent) ?? undefined,
    createdAt: new Date().toISOString(),
  };

  console.error('[client-error]', {
    source: report.source,
    message: report.message,
    route: report.route,
    createdAt: report.createdAt,
  });

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent<ClientErrorReport>('coe-console:client-error', { detail: report }));
  }

  if (sinkEnabled && !reentryGuard && shouldPostReport(report)) {
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
    app_version: sanitizeForErrorReport(ctx.appVersion),
    actor_id: ctx.actorId ?? null,
    actor_email: null,
  });
  if (error) throw error;
}

function truncate(value: string | undefined | null): string | null {
  if (!value) return null;
  return value.length > MAX_FIELD_LEN ? value.slice(0, MAX_FIELD_LEN) : value;
}

export function sanitizeForErrorReport(value: string | undefined | null): string | null {
  const truncated = truncate(value);
  if (!truncated) return null;

  return REDACTION_RULES.reduce((current, [pattern, replacement]) => (
    current.replace(pattern, replacement)
  ), truncated);
}

function sanitizeRoute(route: string | undefined): string | undefined {
  if (!route) return undefined;
  return sanitizeForErrorReport(route.split('?')[0]) ?? undefined;
}

function shouldPostReport(report: ClientErrorReport): boolean {
  const key = `${report.source}:${report.route ?? ''}:${report.message}:${report.stack ?? ''}`;
  const now = Date.now();
  const lastReportedAt = recentReports.get(key);
  recentReports.set(key, now);

  for (const [existingKey, reportedAt] of recentReports) {
    if (now - reportedAt > DEDUPE_WINDOW_MS) recentReports.delete(existingKey);
  }

  return !lastReportedAt || now - lastReportedAt > DEDUPE_WINDOW_MS;
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
      message: sanitizeForErrorReport(error.message || error.name) ?? 'Unknown client error',
      stack: sanitizeForErrorReport(error.stack) ?? undefined,
    };
  }

  if (typeof error === 'string') {
    return { message: sanitizeForErrorReport(error) ?? 'Unknown client error' };
  }

  if (error && typeof error === 'object') {
    const keys = Object.keys(error as Record<string, unknown>).slice(0, 8);
    return {
      message: keys.length
        ? `Non-error rejection (${keys.join(', ')})`
        : 'Non-error rejection',
    };
  }

  return { message: sanitizeForErrorReport(String(error ?? 'Unknown client error')) ?? 'Unknown client error' };
}
