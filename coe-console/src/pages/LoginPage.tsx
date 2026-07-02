import { useState, type FormEvent } from 'react';
import { Card } from '../components/common/Card';
import { DevAccountSwitchPanel } from '../components/dev/DevAccountSwitch';
import { useSession } from '../domain/session';
import { isEnvFlagEnabled } from '../lib/env';
import { theme } from '../styles/theme';

type Mode = 'signin' | 'signup';

export function isPublicSignupEnabled(): boolean {
  return isEnvFlagEnabled('VITE_ALLOW_SIGNUP');
}

export function LoginPage() {
  const signIn = useSession((s) => s.signIn);
  const signUp = useSession((s) => s.signUp);
  const allowSignup = isPublicSignupEnabled();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setInfo(null);

    if (mode === 'signup' && !allowSignup) {
      setBusy(false);
      setError('Public signup is disabled. Ask a CoE admin to create or invite your account.');
      return;
    }

    const fn = mode === 'signin' ? signIn : signUp;
    const { error: errMsg } = await fn(email.trim(), password);
    setBusy(false);
    if (errMsg) {
      setError(errMsg);
      return;
    }
    if (mode === 'signup') {
      setInfo('Account created. Check your email if confirmation is required, then sign in.');
      setMode('signin');
    }
    // Successful signin → onAuthStateChange flips user, RedirectIfAuthed sends them home.
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: theme.surfaceMuted,
        display: 'grid',
        placeItems: 'center',
        padding: 24,
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 11,
              background: theme.primary,
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: 22,
              margin: '0 auto 12px',
              boxShadow: '0 2px 6px rgba(15,118,110,.3)',
            }}
          >
            e
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: theme.ink }}>eSourcing CoE Console</div>
          <div style={{ fontSize: 12.5, color: theme.textSecondary, marginTop: 4 }}>
            {mode === 'signin' || !allowSignup ? 'Sign in to continue' : 'Create your account'}
          </div>
        </div>

        <Card style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <DevAccountSwitchPanel />

          {allowSignup && (
            <div style={{ display: 'flex', gap: 6 }}>
              <TabButton active={mode === 'signin'} onClick={() => switchMode('signin')}>Sign in</TabButton>
              <TabButton active={mode === 'signup'} onClick={() => switchMode('signup')}>Sign up</TabButton>
            </div>
          )}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              autoFocus
              required
              autoComplete="email"
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              required
              minLength={6}
              autoComplete={mode === 'signin' || !allowSignup ? 'current-password' : 'new-password'}
            />

            {error && <Banner kind="error">{error}</Banner>}
            {info && <Banner kind="info">{info}</Banner>}

            <button
              type="submit"
              disabled={busy}
              style={{
                marginTop: 4,
                padding: '11px 14px',
                background: theme.primary,
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                border: 'none',
                borderRadius: theme.radiusSm,
                cursor: busy ? 'wait' : 'pointer',
                opacity: busy ? 0.7 : 1,
                transition: `all ${theme.transitionFast} ${theme.easing}`,
              }}
            >
              {busy ? 'Please wait…' : mode === 'signup' && allowSignup ? 'Create account' : 'Sign in'}
            </button>
          </form>
        </Card>

        <div
          style={{
            marginTop: 14,
            textAlign: 'center',
            fontSize: 11,
            color: theme.textTertiary,
            fontFamily: theme.mono,
          }}
        >
          Backed by Supabase
        </div>
      </div>
    </div>
  );

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setInfo(null);
  }
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: '8px 10px',
        background: active ? theme.primaryMuted : 'transparent',
        color: active ? theme.primary : theme.textSecondary,
        border: `1px solid ${active ? theme.primary : theme.border}`,
        borderRadius: theme.radiusSm,
        fontSize: 12.5,
        fontWeight: 700,
        cursor: 'pointer',
        transition: `all ${theme.transitionFast} ${theme.easing}`,
      }}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
  minLength,
  autoFocus,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  minLength?: number;
  autoFocus?: boolean;
  autoComplete?: string;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: theme.textSecondary }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        style={{
          padding: '10px 12px',
          fontSize: 13.5,
          border: `1px solid ${theme.borderStrong}`,
          borderRadius: theme.radiusSm,
          background: theme.surface,
          color: theme.ink,
          outline: 'none',
        }}
      />
    </label>
  );
}

function Banner({ kind, children }: { kind: 'error' | 'info'; children: React.ReactNode }) {
  const isError = kind === 'error';
  return (
    <div
      style={{
        fontSize: 12.5,
        padding: '8px 11px',
        borderRadius: theme.radiusSm,
        background: isError ? theme.dangerBg : theme.infoBg,
        color: isError ? theme.danger : theme.info,
        border: `1px solid ${isError ? theme.danger : theme.info}`,
        lineHeight: 1.45,
      }}
    >
      {children}
    </div>
  );
}
