import type { ReactNode } from 'react';
import { theme } from '../../styles/theme';
import { Card } from '../common/Card';

export function SearchFilterBar({
  search,
  onSearch,
  searchLabel,
  searchPlaceholder,
  resultLabel,
  onClear,
  clearDisabled,
  children,
}: {
  search: string;
  onSearch: (value: string) => void;
  searchLabel: string;
  searchPlaceholder: string;
  resultLabel: string;
  onClear: () => void;
  clearDisabled: boolean;
  children: ReactNode;
}) {
  return (
    <Card pad={14}>
      <div className="library-filter-grid">
        <label style={{ display: 'grid', gap: 5, minWidth: 0 }}>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              color: theme.textTertiary,
              textTransform: 'uppercase',
              letterSpacing: 0,
            }}
          >
            {searchLabel}
          </span>
          <input
            className="ui-input"
            type="search"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchLabel}
          />
        </label>

        <div className="library-filter-controls">{children}</div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ color: theme.textSecondary, fontSize: 12, fontFamily: theme.mono }}>{resultLabel}</span>
          <button
            type="button"
            className="ui-btn ui-btn--ghost"
            onClick={onClear}
            disabled={clearDisabled}
            style={{ height: 34, padding: '6px 10px', fontSize: 12 }}
          >
            Clear filters
          </button>
        </div>
      </div>
    </Card>
  );
}
