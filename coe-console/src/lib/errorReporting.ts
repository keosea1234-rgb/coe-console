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

let globalReportingInstalled = false;

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

  return report;
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
