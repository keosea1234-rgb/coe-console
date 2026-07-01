import type { PaginationState, TableColumn, TableSortState, TableSortValue } from './table.types';

function normalizeSortValue(value: TableSortValue): string | number | boolean | null {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value.getTime();
  return value;
}

export function compareTableValues(a: TableSortValue, b: TableSortValue): number {
  const left = normalizeSortValue(a);
  const right = normalizeSortValue(b);

  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;

  if (typeof left === 'number' && typeof right === 'number') return left - right;
  if (typeof left === 'boolean' && typeof right === 'boolean') return Number(left) - Number(right);
  return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' });
}

export function sortTableRows<T>(
  rows: T[],
  columns: TableColumn<T>[],
  sort: TableSortState | null,
): T[] {
  if (!sort) return rows;
  const column = columns.find((item) => item.id === sort.columnId);
  if (!column?.sortable || !column.sortValue) return rows;

  const direction = sort.direction === 'asc' ? 1 : -1;
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const compared = compareTableValues(column.sortValue?.(a.row), column.sortValue?.(b.row));
      return compared === 0 ? a.index - b.index : compared * direction;
    })
    .map((item) => item.row);
}

export function paginateTableRows<T>(rows: T[], page: number, pageSize: number): PaginationState<T> {
  const safePageSize = Math.max(1, pageSize);
  const pageCount = Math.max(1, Math.ceil(rows.length / safePageSize));
  const safePage = Math.min(Math.max(0, page), pageCount - 1);
  const start = rows.length === 0 ? 0 : safePage * safePageSize + 1;
  const end = Math.min(rows.length, (safePage + 1) * safePageSize);

  return {
    pageRows: rows.slice(safePage * safePageSize, (safePage + 1) * safePageSize),
    pageCount,
    page: safePage,
    start,
    end,
  };
}
