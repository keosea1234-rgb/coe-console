import type { CSSProperties, ReactNode } from 'react';

export type TableColumnAlign = 'left' | 'center' | 'right';
export type TableSortDirection = 'asc' | 'desc';
export type TableSortValue = string | number | boolean | Date | null | undefined;

export interface TableSortState {
  columnId: string;
  direction: TableSortDirection;
}

export interface TableColumn<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: TableColumnAlign;
  sortable?: boolean;
  sortValue?: (row: T) => TableSortValue;
  width?: number | string;
  minWidth?: number | string;
  headerStyle?: CSSProperties;
  cellStyle?: CSSProperties;
}

export interface PaginationState<T> {
  pageRows: T[];
  pageCount: number;
  page: number;
  start: number;
  end: number;
}
