import assert from 'node:assert/strict';
import test from 'node:test';
import * as React from 'react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { TableColumn } from '../src/shared/table';

(globalThis as { React?: typeof React }).React = React;

const {
  DataTable,
  paginateTableRows,
  sortTableRows,
} = await import('../src/shared/table');

interface Row {
  id: string;
  name: string;
  spend: number;
}

const columns: TableColumn<Row>[] = [
  {
    id: 'name',
    header: 'Name',
    cell: (row) => row.name,
    sortable: true,
    sortValue: (row) => row.name,
  },
  {
    id: 'spend',
    header: 'Spend',
    align: 'right',
    cell: (row) => `$${row.spend}`,
    sortable: true,
    sortValue: (row) => row.spend,
  },
];

test('DataTable renders loading state', () => {
  const html = renderToStaticMarkup(
    createElement(DataTable<Row>, {
      rows: [],
      columns,
      getRowId: (row) => row.id,
      loading: true,
      loadingMessage: 'Loading requests...',
    }),
  );

  assert.match(html, /Loading requests/);
});

test('DataTable renders empty state', () => {
  const html = renderToStaticMarkup(
    createElement(DataTable<Row>, {
      rows: [],
      columns,
      getRowId: (row) => row.id,
      emptyMessage: 'No matching rows.',
    }),
  );

  assert.match(html, /No matching rows/);
});

test('sortTableRows sorts rows by typed column definitions', () => {
  const rows: Row[] = [
    { id: '1', name: 'Films', spend: 200 },
    { id: '2', name: 'Resins', spend: 500 },
    { id: '3', name: 'Labels', spend: 100 },
  ];

  const sorted = sortTableRows(rows, columns, { columnId: 'spend', direction: 'desc' });

  assert.deepEqual(sorted.map((row) => row.name), ['Resins', 'Films', 'Labels']);
});

test('paginateTableRows returns the requested client-side page', () => {
  const rows: Row[] = [
    { id: '1', name: 'A', spend: 1 },
    { id: '2', name: 'B', spend: 2 },
    { id: '3', name: 'C', spend: 3 },
    { id: '4', name: 'D', spend: 4 },
    { id: '5', name: 'E', spend: 5 },
  ];

  const page = paginateTableRows(rows, 1, 2);

  assert.equal(page.pageCount, 3);
  assert.equal(page.start, 3);
  assert.equal(page.end, 4);
  assert.deepEqual(page.pageRows.map((row) => row.id), ['3', '4']);
});
