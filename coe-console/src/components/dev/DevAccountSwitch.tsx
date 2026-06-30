import { useState } from 'react';
import { useSession } from '../../domain/session';
import { theme } from '../../styles/theme';

// Dev-only convenience: one-click switch between the seeded admin and user
// accounts. Gated on import.meta.env.DEV so it is tree-shaken out of production
// builds, and on the presence of VITE_DEV_* credentials so it stays inert if
// they are not configured. This intentionally never ships to production.
const ADMIN = {
  email: import.meta.env.VITE_DEV_ADMIN_EMAIL as string | undefined,
  password: import.meta.env.VITE_DEV_ADMIN_PASSWORD as string | undefined,
};
const USER = {
  email: import.meta.env.VITE_DEV_USER_EMAIL as string | undefined,
  password: import.meta.env.VITE_DEV_USER_PASSWORD as string | undefined,
};

const CONFIGURED =
  import.meta.env.DEV &&
  !!ADMIN.email &&
  !!ADMIN.password &&
  !!USER.email &&
  !!USER.password;

export function DevAccountSwitch() {
  const user = useSession((s) => s.user);
  const signIn = useSession((s) => s.signIn);
  const [busy, setBusy] = useState<null | 'admin' | 'user'>(null);
  const [error, setError] = useState<string | null>(null);

  if (!CONFIGURED) return null;

  const isAdmin = user?.role === 'admin';

  const switchTo = async (role: 'admin' | 'user') => {
    const target = role === 'admin' ? ADMIN : USER;
    if (!target.email || !target.password) return;
    setBusy(role);
    setError(null);
    const { error: signInError } = await signIn(target.email, target.password);
    if (signInError) setError(signInError);
    setBusy(null);
  };

  // When signed in, offer a single toggle to the other role; otherwise (e.g. on
  // the login screen) offer both.
  const targets: ('admin' | 'user')[] = !user ? ['admin', 'user'] : isAdmin ? ['user'] : ['admin'];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 14,
        left: 14,
        zIndex: 80,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        alignItems: 'flex-start',
        padding: 8,
        borderRadius: 10,
        background: theme.surface,
        border: `1px dashed ${theme.borderStrong}`,
        boxShadow: theme.shadowRaised,
        maxWidth: 240,
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: '.08em',
          textTransform: 'uppercase',
          color: theme.textTertiary,
          fontFamily: theme.mono,
        }}
      >
        Dev · {user ? (isAdmin ? 'Admin' : 'User') : 'Signed out'}
      </span>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {targets.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => void switchTo(role)}
            disabled={busy !== null}
            className="ui-btn ui-btn--dark"
            style={{ fontSize: 11.5, padding: '6px 10px', cursor: busy ? 'wait' : 'pointer' }}
          >
            {busy === role
              ? 'Switching…'
              : user
                ? `Switch to ${role === 'admin' ? 'Admin' : 'User'}`
                : `Sign in as ${role === 'admin' ? 'Admin' : 'User'}`}
          </button>
        ))}
      </div>
      {error && (
        <span role="alert" style={{ fontSize: 10.5, color: theme.danger, fontWeight: 600 }}>
          {error}
        </span>
      )}
    </div>
  );
}
