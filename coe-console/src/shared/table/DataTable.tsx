import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { theme } from '../../styles/theme';
import {
  paginateTableRows,
  sortTableRows,
} from './tableUtils';
import type { TableColumn, TableColumnAlign, TableSortState } from './table.types';

function alignToTextAlign(align: TableColumnAlign | undefined): CSSProperties['textAlign'] {
  if (align === 'right') return 'right';
  if (align === 'center') return 'center';
  return 'left';
}

function nextSortState(current: TableSortState | null, columnId: string): TableSortState {
  if (current?.columnId !== columnId) return { columnId, direction: 'asc' };
  return { columnId, direction: current.direction === 'asc' ? 'desc' : 'asc' };
}

const headerCellStyle: CSSProperties = {
  textAlign: 'left',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '.06em',
  textTransform: 'uppercase',
  color: theme.textTertiary,
  fontFamily: theme.mono,
  padding: '9px 12px',
  position: 'sticky',
  top: 0,
  background: theme.surfaceRaised,
  borderBottom: `1px solid ${theme.border}`,
  zIndex: 1,
};

const cellStyle: CSSProperties = {
  fontSize: 12.5,
  padding: '9px 12px',
  borderBottom: `1px solid ${theme.border}`,
  whiteSpace: 'nowrap',
  color: theme.ink,
};

export function DataTable<T>({
  rows,
  columns,
  getRowId,
  loading = false,
  error,
  emptyMessage = 'No rows to display.',
  loadingMessage = 'Loading...',
  initialSort = null,
  pageSize: initialPageSize = 25,
  pageSizeOptions = [10, 25, 50],
  pagination = true,
  rowActions,
  rowActionsHeader = 'Actions',
  minWidth = 720,
  maxHeight,
  onRowClick,
  rowClassName,
  tableLabel,
}: {
  rows: T[];
  columns: TableColumn<T>[];
  getRowId: (row: T) => string;
  loading?: boolean;
  error?: ReactNode;
  emptyMessage?: ReactNode;
  loadingMessage?: ReactNode;
  initialSort?: TableSortState | null;
  pageSize?: number;
  pageSizeOptions?: number[];
  pagination?: boolean;
  rowActions?: (row: T) => ReactNode;
  rowActionsHeader?: ReactNode;
  minWidth?: number | string;
  maxHeight?: number | string;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string | undefined;
  tableLabel?: string;
}) {
  const [sort, setSort] = useState<TableSortState | null>(initialSort);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [page, setPage] = useState(0);
  const totalColumns = columns.length + (rowActions ? 1 : 0);

  const sortedRows = useMemo(() => sortTableRows(rows, columns, sort), [rows, columns, sort]);
  const pageState = useMemo(
    () => (pagination ? paginateTableRows(sortedRows, page, pageSize) : {
      pageRows: sortedRows,
      pageCount: 1,
      page: 0,
      start: sortedRows.length === 0 ? 0 : 1,
      end: sortedRows.length,
    }),
    [page, pageSize, pagination, sortedRows],
  );

  useEffect(() => {
    setPage(0);
  }, [pageSize, rows.length, sort?.columnId, sort?.direction]);

  useEffect(() => {
    if (page !== pageState.page) setPage(pageState.page);
  }, [page, pageState.page]);

  const bodyRows = loading || error ? [] : pageState.pageRows;

  return (
    <div>
      <div style={{ overflowX: 'auto', maxHeight }}>
        <table
          aria-label={tableLabel}
          style={{ width: '100%', borderCollapse: 'collapse', minWidth }}
        >
          <thead>
            <tr>
              {columns.map((column) => {
                const activeSort = sort?.columnId === column.id ? sort.direction : null;
                const textAlign = alignToTextAlign(column.align);
                return (
                  <th
                    key={column.id}
                    aria-sort={
                      activeSort === 'asc' ? 'ascending' : activeSort === 'desc' ? 'descending' : undefined
                    }
                    style={{
                      ...headerCellStyle,
                      textAlign,
                      width: column.width,
                      minWidth: column.minWidth,
                      ...column.headerStyle,
                    }}
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => setSort((current) => nextSortState(current, column.id))}
                        style={{
                          width: '100%',
                          display: 'inline-flex',
                          justifyContent:
                            column.align === 'right'
                              ? 'flex-end'
                              : column.align === 'center'
                                ? 'center'
                                : 'flex-start',
                          alignItems: 'center',
                          gap: 5,
                          padding: 0,
                          border: 'none',
                          background: 'transparent',
                          color: 'inherit',
                          font: 'inherit',
                          textTransform: 'inherit',
                          cursor: 'pointer',
                        }}
                      >
                        <span>{column.header}</span>
                        <span aria-hidden style={{ fontSize: 9, color: activeSort ? theme.primary : theme.textTertiary }}>
                          {activeSort === 'asc' ? '^' : activeSort === 'desc' ? 'v' : '-'}
                        </span>
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
              {rowActions && <th style={headerCellStyle}>{rowActionsHeader}</th>}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={totalColumns} style={{ ...cellStyle, textAlign: 'center', color: theme.textTertiary, padding: 32 }}>
                  {loadingMessage}
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td
                  colSpan={totalColumns}
                  role="alert"
                  style={{ ...cellStyle, textAlign: 'center', color: theme.danger, padding: 32, whiteSpace: 'normal' }}
                >
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && bodyRows.length === 0 && (
              <tr>
                <td colSpan={totalColumns} style={{ ...cellStyle, textAlign: 'center', color: theme.textTertiary, padding: 32 }}>
                  {emptyMessage}
                </td>
              </tr>
            )}
            {bodyRows.map((row) => (
              <tr
                key={getRowId(row)}
                className={rowClassName?.(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={{
                  cursor: onRowClick ? 'pointer' : undefined,
                  transition: `background ${theme.transitionFast} ${theme.easing}`,
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.background = theme.surfaceMuted;
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background = 'transparent';
                }}
              >
                {columns.map((column) => (
                  <td
                    key={column.id}
                    style={{
                      ...cellStyle,
                      textAlign: alignToTextAlign(column.align),
                      width: column.width,
                      minWidth: column.minWidth,
                      fontFamily: column.align === 'right' ? theme.mono : undefined,
                      fontVariantNumeric: column.align === 'right' ? 'tabular-nums' : undefined,
                      ...column.cellStyle,
                    }}
                  >
                    {column.cell(row)}
                  </td>
                ))}
                {rowActions && (
                  <td style={{ ...cellStyle, minWidth: 190 }} onClick={(event) => event.stopPropagation()}>
                    {rowActions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && !loading && !error && rows.length > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            padding: '10px 12px',
            borderTop: `1px solid ${theme.border}`,
            background: theme.surfaceRaised,
          }}
        >
          <span style={{ fontSize: 11.5, color: theme.textTertiary, fontFamily: theme.mono }}>
            {pageState.start}-{pageState.end} of {rows.length}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select
              className="ui-select"
              aria-label="Rows per page"
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
              style={{ height: 28, width: 94, fontSize: 11.5, fontWeight: 700 }}
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option} rows
                </option>
              ))}
            </select>
            <button
              type="button"
              className="ui-btn ui-btn--ghost"
              disabled={pageState.page === 0}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              style={{ height: 28, padding: '4px 8px', fontSize: 11.5 }}
            >
              Previous
            </button>
            <span style={{ fontSize: 11.5, color: theme.textSecondary, fontFamily: theme.mono }}>
              Page {pageState.page + 1} / {pageState.pageCount}
            </span>
            <button
              type="button"
              className="ui-btn ui-btn--ghost"
              disabled={pageState.page >= pageState.pageCount - 1}
              onClick={() => setPage((current) => Math.min(pageState.pageCount - 1, current + 1))}
              style={{ height: 28, padding: '4px 8px', fontSize: 11.5 }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
