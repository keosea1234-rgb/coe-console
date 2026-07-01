import { CardTitle } from '../../../components/common/Card';
import { fmtUSD } from '../../../domain/selectors';
import { theme } from '../../../styles/theme';
import type { RequestInboxFilter } from '../model/requestInbox.types';

export function RequestInboxFilters({
  requestCount,
  filter,
  totalSpend,
  activeCount,
  archivedCount,
  onFilterChange,
}: {
  requestCount: number;
  filter: RequestInboxFilter;
  totalSpend: number;
  activeCount: number;
  archivedCount: number;
  onFilterChange: (filter: RequestInboxFilter) => void;
}) {
  return (
    <div
      style={{
        padding: '16px 18px 12px',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <CardTitle sub={`${requestCount} request${requestCount === 1 ? '' : 's'} received from users`}>
        Request inbox
      </CardTitle>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: theme.textSecondary,
            padding: '4px 8px',
            background: theme.surfaceMuted,
            borderRadius: 6,
            border: `1px solid ${theme.border}`,
            fontFamily: theme.mono,
          }}
        >
          Pipeline {fmtUSD(totalSpend)}
        </div>
        <div
          style={{
            display: 'flex',
            gap: 4,
            padding: 3,
            background: theme.surfaceMuted,
            borderRadius: 6,
            border: `1px solid ${theme.border}`,
          }}
        >
          {(['active', 'new', 'archived', 'all'] as const).map((item) => {
            const active = filter === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => onFilterChange(item)}
                style={{
                  height: 24,
                  padding: '0 10px',
                  fontSize: 11.5,
                  fontWeight: 700,
                  borderRadius: 4,
                  border: 'none',
                  cursor: 'pointer',
                  background: active ? theme.surface : 'transparent',
                  color: active ? theme.ink : theme.textSecondary,
                  boxShadow: active ? theme.shadow : 'none',
                  textTransform: 'capitalize',
                }}
              >
                {item === 'new'
                  ? 'Open'
                  : item === 'active'
                    ? `Active (${activeCount})`
                    : item === 'archived'
                      ? `Archived (${archivedCount})`
                      : 'All'}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
