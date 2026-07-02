import { Link } from 'react-router-dom';
import { theme } from '../../styles/theme';
import { IconReport } from './icons';
import { useSession } from '../../domain/session';
import { hasPermission } from '../../domain/authz';
import { DevAccountSwitchButton } from '../dev/DevAccountSwitch';

export type ConsoleTab =
  | 'exec'
  | 'coverageMap'
  | 'ops'
  | 'learning'
  | 'governance'
  | 'category'
  | 'myRequests'
  | 'spend'
  | 'inbox'
  | 'errors';

type NavItem = { value: ConsoleTab; label: string; badge?: number };

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

  const overviewItems: NavItem[] = [
    { value: 'exec', label: 'Exec overview' },
    { value: 'coverageMap', label: 'Coverage map' },
    { value: 'ops', label: 'Operational console' },
  ];
  const knowledgeItems: NavItem[] = [
    { value: 'learning', label: 'Learning' },
    { value: 'governance', label: 'Governance' },
    { value: 'category', label: 'Category' },
  ];
  const workspaceItems: NavItem[] = [
    ...(canViewOwnRequests ? [{ value: 'myRequests' as const, label: 'My requests', badge: myRequests }] : []),
    ...(canAdminEvents ? [{ value: 'spend' as const, label: 'Spend data' }] : []),
    ...(canViewRequestInbox ? [{ value: 'inbox' as const, label: 'Inbox', badge: pendingRequests }] : []),
    ...(canViewErrors ? [{ value: 'errors' as const, label: 'Errors' }] : []),
  ];

  const navGroups: Array<{ title: string; items: NavItem[] }> = [
    {
      title: 'Overview',
      items: overviewItems,
    },
    {
      title: 'Knowledge',
      items: knowledgeItems,
    },
    {
      title: canAdminEvents || canViewRequestInbox || canViewErrors ? 'Workspace & Admin' : 'Workspace',
      items: workspaceItems,
    },
  ].filter((group) => group.items.length > 0);

  return (
    <aside className="app-sidebar" aria-label="Primary navigation">
      <div className="app-sidebar__brand">
        <div className="app-sidebar__mark">e</div>
        <div style={{ minWidth: 0 }}>
          <div className="app-sidebar__brand-title">eSourcing CoE</div>
          <div className="app-sidebar__brand-subtitle">Spend &amp; Coverage Console</div>
        </div>
      </div>

      <nav className="app-sidebar__nav">
        {navGroups.map((group) => (
          <section key={group.title} className="app-sidebar__group">
            <div className="app-sidebar__group-title">{group.title}</div>
            <div className="app-sidebar__group-items">
              {group.items.map((item) => {
                const active = item.value === tab;
                return (
                  <button
                    key={item.value}
                    type="button"
                    aria-current={active ? 'page' : undefined}
                    onClick={() => onTab(item.value)}
                    className={`app-sidebar__item${active ? ' is-active' : ''}`}
                  >
                    <span>{item.label}</span>
                    {!!item.badge && <span className="app-sidebar__badge">{item.badge}</span>}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </nav>

      <div className="app-sidebar__footer">
        <div className="app-sidebar__quick-actions">
          <span className="app-sidebar__currency">USD</span>
          {canAdminEvents && (
            <button type="button" onClick={onReports} className="ui-btn ui-btn--dark app-sidebar__action">
              <IconReport size={14} />
              Weekly reports
            </button>
          )}
          {canCreateRequest && (
            <Link to="/new-request" className="ui-btn ui-btn--primary app-sidebar__action">
              New sourcing request
            </Link>
          )}
        </div>

        {user && (
          <div className="app-sidebar__account">
            <div className="app-sidebar__role" style={{ color: isAdminRole ? theme.primary : theme.textTertiary }}>
              {isAdminRole ? 'Admin' : 'User'}
            </div>
            <div className="app-sidebar__email" title={user.email}>
              {user.email}
            </div>
            <div className="app-sidebar__account-actions">
              <DevAccountSwitchButton compact className="ui-btn ui-btn--secondary app-sidebar__small-button" />
              <button
                type="button"
                onClick={logout}
                className="ui-btn ui-btn--ghost app-sidebar__small-button"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
