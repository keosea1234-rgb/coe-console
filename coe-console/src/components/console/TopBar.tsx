import { Link } from 'react-router-dom';
import { theme } from '../../styles/theme';
import { SegmentedControl } from '../common/primitives';
import { IconReport } from './icons';
import { useSession } from '../../domain/session';
import { hasPermission } from '../../domain/authz';

export type ConsoleTab =
  | 'exec'
  | 'coverageMap'
  | 'ops'
  | 'templatesLearning'
  | 'myRequests'
  | 'spend'
  | 'inbox'
  | 'errors';

export function TopBar({
  tab,
  onTab,
  onReports,
  pendingRequests = 0,
  myRequests = 0,
}: {
  tab: ConsoleTab;
  onTab: (t: ConsoleTab) => void;
  onReports: () => void;
  pendingRequests?: number;
  myRequests?: number;
}) {
  const user = useSession((s) => s.user);
  const logout = useSession((s) => s.logout);
  const isAdminRole = user?.role === 'admin';
  const canCreateRequest = hasPermission(user, 'request:create');
  const canViewOwnRequests = hasPermission(user, 'request:view_own');
  const canViewRequestInbox = hasPermission(user, 'request:view_all');
  const canAdminEvents = hasPermission(user, 'event:admin');
  const canViewErrors = hasPermission(user, 'admin:audit');

  const baseTabs: { value: ConsoleTab; label: string }[] = [
    { value: 'exec', label: 'Exec overview' },
    { value: 'coverageMap', label: 'Coverage map' },
    { value: 'ops', label: 'Operational console' },
    { value: 'templatesLearning', label: 'Templates & Learning' },
  ];
  const userTabs: { value: ConsoleTab; label: string }[] = canViewOwnRequests
    ? [
        {
          value: 'myRequests',
          label: myRequests > 0 ? `My requests (${myRequests})` : 'My requests',
        },
      ]
    : [];
  const adminTabs: { value: ConsoleTab; label: string }[] = canAdminEvents || canViewRequestInbox || canViewErrors
    ? [
        ...(canAdminEvents ? [{ value: 'spend' as const, label: 'Spend data' }] : []),
        ...(canViewRequestInbox
          ? [
              {
                value: 'inbox' as const,
                label: pendingRequests > 0 ? `Inbox (${pendingRequests})` : 'Inbox',
              },
            ]
          : []),
        ...(canViewErrors ? [{ value: 'errors' as const, label: 'Errors' }] : []),
      ]
    : [];
  const tabs = [...baseTabs, ...userTabs, ...adminTabs];

  return (
    <header className="sticky-header" style={{ height: theme.headerH }}>
      <div
        style={{
          maxWidth: 1320,
          margin: '0 auto',
          padding: '0 20px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: theme.primary,
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: 15,
              boxShadow: '0 1px 3px rgba(15,118,110,.3)',
            }}
          >
            e
          </div>
          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0, color: theme.ink }}>
              eSourcing CoE
            </div>
            <div style={{ fontSize: 11, color: theme.textSecondary, fontWeight: 500 }}>
              Sourcing Spend &amp; Coverage Console
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ margin: '0 auto' }}>
          <SegmentedControl options={tabs} value={tab} onChange={onTab} />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>
          {canCreateRequest && (
            <Link
              to="/new-request"
              className="ui-btn ui-btn--primary"
              style={{ textDecoration: 'none', padding: '7px 13px', fontSize: 12.5 }}
            >
              New sourcing request
            </Link>
          )}
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              fontFamily: theme.mono,
              color: theme.textSecondary,
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: 6,
              padding: '5px 9px',
            }}
          >
            USD
          </span>
          {canAdminEvents && (
            <button type="button" onClick={onReports} className="ui-btn ui-btn--dark" style={{ fontSize: 12.5 }}>
              <IconReport size={14} />
              Weekly reports
            </button>
          )}
          {user && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                paddingLeft: 8,
                marginLeft: 4,
                borderLeft: `1px solid ${theme.border}`,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                    color: isAdminRole ? theme.primary : theme.textTertiary,
                    fontFamily: theme.mono,
                  }}
                >
                  {isAdminRole ? 'Admin' : 'User'}
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: theme.textSecondary }}>
                  {user.email}
                </span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="ui-btn ui-btn--ghost"
                style={{ fontSize: 11.5, padding: '6px 10px' }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
