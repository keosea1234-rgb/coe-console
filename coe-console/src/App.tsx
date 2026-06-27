import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ConsolePage } from './pages/ConsolePage';
import { RequestFormPage } from './pages/RequestFormPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { LoginPage } from './pages/LoginPage';
import { useSession } from './domain/session';
import { theme } from './styles/theme';

function AuthGate({ children }: { children: React.ReactElement }) {
  const loading = useSession((s) => s.loading);
  if (loading) return <SplashScreen />;
  return children;
}

function RequireAuth({ children }: { children: React.ReactElement }) {
  const user = useSession((s) => s.user);
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

function RequireRole({ role, children }: { role: 'user' | 'admin'; children: React.ReactElement }) {
  const user = useSession((s) => s.user);
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function RedirectIfAuthed({ children }: { children: React.ReactElement }) {
  const user = useSession((s) => s.user);
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  if (user) return <Navigate to={from} replace />;
  return children;
}

function SplashScreen() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: theme.surfaceMuted,
        color: theme.textSecondary,
        fontSize: 13,
        fontFamily: theme.mono,
      }}
    >
      Loading…
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthGate>
        <Routes>
          <Route
            path="/login"
            element={
              <RedirectIfAuthed>
                <LoginPage />
              </RedirectIfAuthed>
            }
          />
          <Route
            path="/"
            element={
              <RequireAuth>
                <ConsolePage />
              </RequireAuth>
            }
          />
          <Route
            path="/new-request"
            element={
              <RequireRole role="user">
                <RequestFormPage />
              </RequireRole>
            }
          />
          <Route
            path="/feedback/:eventId"
            element={
              <RequireAuth>
                <FeedbackPage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthGate>
    </BrowserRouter>
  );
}
