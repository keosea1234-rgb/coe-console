import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportClientError } from '../../lib/errorReporting';
import { theme } from '../../styles/theme';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportClientError(error, { source: 'error-boundary', componentStack: info.componentStack ?? undefined });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: 24,
          background: theme.surfaceMuted,
          color: theme.ink,
        }}
      >
        <section
          role="alert"
          style={{
            width: 'min(100%, 520px)',
            border: `1px solid ${theme.border}`,
            borderRadius: theme.radiusSm,
            background: theme.surface,
            boxShadow: theme.shadowRaised,
            padding: 22,
          }}
        >
          <div
            style={{
              marginBottom: 8,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 0,
              color: theme.danger,
              textTransform: 'uppercase',
            }}
          >
            Application error
          </div>
          <h1 style={{ margin: 0, fontSize: 22, lineHeight: 1.2 }}>Something went wrong</h1>
          <p
            style={{
              margin: '10px 0 18px',
              color: theme.textSecondary,
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            The console hit an unexpected error. Reload the page to start a fresh session. If
            the problem continues, contact your CoE administrator.
          </p>
          <button
            type="button"
            className="ui-btn ui-btn--primary"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </section>
      </main>
    );
  }
}
