import { useState } from 'react';
import { useSession } from '../../domain/session';
import { getEnvValue, isEnvFlagEnabled } from '../../lib/env';
import { theme } from '../../styles/theme';

type SwitchRole = 'admin' | 'user';

// Convenience account switch: one-click sign-in between configured admin and
// user test accounts. It is local-dev by default, or explicit when
// VITE_ENABLE_ACCOUNT_SWITCH=true is configured for a controlled test deploy.
const ADMIN = {
  email: getEnvValue('VITE_DEV_ADMIN_EMAIL'),
  password: getEnvValue('VITE_DEV_ADMIN_PASSWORD'),
};
const USER = {
  email: getEnvValue('VITE_DEV_USER_EMAIL'),
  password: getEnvValue('VITE_DEV_USER_PASSWORD'),
};

const IS_VITE_DEV = ((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV ?? false);
const CONFIGURED =
  (IS_VITE_DEV || isEnvFlagEnabled('VITE_ENABLE_ACCOUNT_SWITCH')) &&
  !!ADMIN.email &&
  !!ADMIN.password &&
  !!USER.email &&
  !!USER.password;

const roleLabel = (role: SwitchRole) => (role === 'admin' ? 'Admin' : 'User');
const accountFor = (role: SwitchRole) => (role === 'admin' ? ADMIN : USER);

export function isDevAccountSwitchConfigured() {
  return CONFIGURED;
}

export function DevAccountSwitchButton({
  compact = false,
  className = 'ui-btn ui-btn--secondary',
}: {
  compact?: boolean;
  className?: string;
}) {
  const user = useSession((s) => s.user);
  const signIn = useSession((s) => s.signIn);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!CONFIGURED) return null;

  const targetRole: SwitchRole = user?.role === 'admin' ? 'user' : 'admin';
  const target = accountFor(targetRole);

  const switchToTarget = async () => {
    if (!target.email || !target.password) return;
    setBusy(true);
    setError(null);
    const { error: signInError } = await signIn(target.email, target.password);
    if (signInError) setError(signInError);
    setBusy(false);
  };

  const label = busy
    ? 'Switching...'
    : user
      ? `Switch to ${roleLabel(targetRole)}`
      : `Sign in as ${roleLabel(targetRole)}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: compact ? 'flex-end' : 'stretch' }}>
      <button
        type="button"
        onClick={() => void switchToTarget()}
        disabled={busy}
        className={className}
        style={{ fontSize: compact ? 11.5 : 12.5, padding: compact ? '6px 10px' : '8px 12px' }}
        title={user ? `Switch test account to ${roleLabel(targetRole)}` : `Sign in as ${roleLabel(targetRole)}`}
      >
        {label}
      </button>
      {error && (
        <span role="alert" style={{ fontSize: 10.5, color: theme.danger, fontWeight: 600, textAlign: 'right' }}>
          {error}
        </span>
      )}
    </div>
  );
}

export function DevAccountSwitchPanel() {
  const user = useSession((s) => s.user);
  const signIn = useSession((s) => s.signIn);
  const [busy, setBusy] = useState<null | SwitchRole>(null);
  const [error, setError] = useState<string | null>(null);

  if (!CONFIGURED) return null;

  const isAdmin = user?.role === 'admin';
  const targets: SwitchRole[] = !user ? ['admin', 'user'] : isAdmin ? ['user'] : ['admin'];

  const switchTo = async (role: SwitchRole) => {
    const target = accountFor(role);
    if (!target.email || !target.password) return;
    setBusy(role);
    setError(null);
    const { error: signInError } = await signIn(target.email, target.password);
    if (signInError) setError(signInError);
    setBusy(null);
  };

  return (
    <div
      style={{
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
        Account switch - {user ? roleLabel(isAdmin ? 'admin' : 'user') : 'Signed out'}
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
              ? 'Switching...'
              : user
                ? `Switch to ${roleLabel(role)}`
                : `Sign in as ${roleLabel(role)}`}
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

export function DevAccountSwitch() {
  if (!CONFIGURED) return null;

  return (
    <div style={{ position: 'fixed', bottom: 14, left: 14, zIndex: 80 }}>
      <DevAccountSwitchPanel />
    </div>
  );
}
