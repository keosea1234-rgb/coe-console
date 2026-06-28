import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { configureErrorReportingSink, installGlobalErrorReporting } from './lib/errorReporting';
import { useSession } from './domain/session';
import './styles/global.css';

installGlobalErrorReporting();

configureErrorReportingSink({
  enabled: import.meta.env.PROD,
  resolveContext: () => {
    const user = useSession.getState().user;
    return {
      appVersion: import.meta.env.VITE_APP_VERSION ?? undefined,
      actorId: user?.id ?? null,
      actorEmail: user?.email ?? null,
    };
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
