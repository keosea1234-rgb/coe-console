import { useEffect, useMemo, useState } from 'react';
import { Card, CardTitle } from '../common/Card';
import { Button } from '../common/primitives';
import { DataTable, type TableColumn } from '../../shared/table';
import { listClientErrors, type ClientErrorLogEntry } from '../../domain/repository';
import { theme } from '../../styles/theme';

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function shortId(value: string | undefined) {
  if (!value) return '-';
  return value.length <= 12 ? value : `${value.slice(0, 8)}...`;
}

function detailBlock(label: string, value: string | undefined) {
  if (!value) return null;
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '.06em',
          textTransform: 'uppercase',
          color: theme.textTertiary,
          fontFamily: theme.mono,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <pre
        style={{
          margin: 0,
          maxHeight: 220,
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          overflowWrap: 'anywhere',
          background: theme.surfaceMuted,
          border: `1px solid ${theme.border}`,
          borderRadius: 6,
          padding: 10,
          color: theme.ink,
          fontSize: 11.5,
          lineHeight: 1.45,
          fontFamily: theme.mono,
        }}
      >
        {value}
      </pre>
    </div>
  );
}

export function ClientErrorLog() {
  const [rows, setRows] = useState<ClientErrorLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ClientErrorLogEntry | null>(null);

  const refresh = () => {
    setLoading(true);
    setError(null);
    void listClientErrors(100)
      .then((entries) => {
        setRows(entries);
        setSelected((current) => (
          current ? entries.find((entry) => entry.id === current.id) ?? null : null
        ));
      })
      .catch((err) => {
        console.error('[client-errors] failed to load error log', err);
        setError('Unable to load client errors.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  const columns = useMemo<TableColumn<ClientErrorLogEntry>[]>(
    () => [
      {
        id: 'reportedAt',
        header: 'Time',
        sortable: true,
        sortValue: (entry) => new Date(entry.reportedAt),
        width: 130,
        cellStyle: { fontFamily: theme.mono },
        cell: (entry) => formatDate(entry.reportedAt),
      },
      {
        id: 'source',
        header: 'Source',
        sortable: true,
        sortValue: (entry) => entry.source,
        width: 150,
        cell: (entry) => (
          <span
            style={{
              display: 'inline-flex',
              padding: '3px 8px',
              borderRadius: 999,
              background: theme.dangerBg,
              color: theme.danger,
              fontSize: 11,
              fontWeight: 800,
              fontFamily: theme.mono,
            }}
          >
            {entry.source}
          </span>
        ),
      },
      {
        id: 'route',
        header: 'Route',
        sortable: true,
        sortValue: (entry) => entry.route ?? '',
        minWidth: 130,
        cellStyle: { fontFamily: theme.mono, color: theme.textSecondary },
        cell: (entry) => entry.route ?? '-',
      },
      {
        id: 'message',
        header: 'Message',
        sortable: true,
        sortValue: (entry) => entry.message,
        minWidth: 320,
        cellStyle: {
          maxWidth: 520,
          whiteSpace: 'normal',
          overflowWrap: 'anywhere',
        },
        cell: (entry) => entry.message,
      },
      {
        id: 'actor',
        header: 'Actor',
        sortable: true,
        sortValue: (entry) => entry.actorId ?? '',
        width: 110,
        cellStyle: { fontFamily: theme.mono, color: theme.textTertiary },
        cell: (entry) => shortId(entry.actorId),
      },
    ],
    [],
  );

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card pad={0}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            alignItems: 'flex-start',
            padding: '16px 18px 12px',
          }}
        >
          <CardTitle sub="Recent sanitized browser runtime reports">Client error log</CardTitle>
          <Button variant="secondary" onClick={refresh} disabled={loading} style={{ fontSize: 12 }}>
            Refresh
          </Button>
        </div>
        <DataTable
          rows={rows}
          columns={columns}
          getRowId={(entry) => entry.id}
          loading={loading}
          error={error}
          emptyMessage="No client errors reported."
          loadingMessage="Loading client errors..."
          initialSort={{ columnId: 'reportedAt', direction: 'desc' }}
          pageSize={25}
          pageSizeOptions={[10, 25, 50, 100]}
          minWidth={980}
          maxHeight={520}
          onRowClick={setSelected}
          tableLabel="Client error log"
        />
      </Card>

      {selected && (
        <Card>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              alignItems: 'flex-start',
              marginBottom: 14,
            }}
          >
            <CardTitle sub={`${selected.source} - ${new Date(selected.reportedAt).toLocaleString()}`}>
              Error details
            </CardTitle>
            <Button variant="ghost" onClick={() => setSelected(null)} style={{ fontSize: 12 }}>
              Close
            </Button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            {detailBlock('Message', selected.message)}
            {detailBlock('Route', selected.route)}
            {detailBlock('Stack', selected.stack)}
            {detailBlock('Component stack', selected.componentStack)}
            {detailBlock('Browser', selected.userAgent)}
            {detailBlock('App version', selected.appVersion)}
          </div>
        </Card>
      )}
    </div>
  );
}
