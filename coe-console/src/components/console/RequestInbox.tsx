import { useEffect, useMemo, useState } from 'react';
import { theme } from '../../styles/theme';
import { Card, CardTitle } from '../common/Card';
import type { FeedbackResponse, SourcingEvent } from '../../domain/types';
import { fmtUSD } from '../../domain/selectors';
import { STATUSES, type Status } from '../../domain/constants';
import { useStore } from '../../domain/store';
import { Button, StatusBadge } from '../common/primitives';
import { CATEGORY_BY_NAME } from '../../domain/categories';
import { canEmailFeedback, openFeedbackEmail } from '../../lib/feedbackEmail';
import {
  createAttachmentDownloadUrl,
  listAttachmentsForEvents,
  type AttachmentRow,
} from '../../domain/attachments';

const th: React.CSSProperties = {
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
const td: React.CSSProperties = {
  fontSize: 12.5,
  padding: '10px 12px',
  borderBottom: `1px solid ${theme.border}`,
  whiteSpace: 'nowrap',
  color: theme.ink,
};
const num: React.CSSProperties = {
  ...td,
  fontFamily: theme.mono,
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
};

function fmtReceivedAt(iso: string | undefined): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb >= 10 ? 0 : 1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
}

function AttachmentsCell({
  attachments,
  error,
  downloadUrls,
  downloadUrlError,
  downloadingId,
  onDownload,
}: {
  attachments?: AttachmentRow[];
  error: string | null;
  downloadUrls: Record<string, string>;
  downloadUrlError: string | null;
  downloadingId: string | null;
  onDownload: (attachment: AttachmentRow) => void;
}) {
  if (error) {
    return (
      <span role="alert" style={{ fontSize: 11.5, color: theme.danger, whiteSpace: 'normal' }}>
        Unable to load attachments
      </span>
    );
  }

  if (!attachments) {
    return <span style={{ fontSize: 11.5, color: theme.textTertiary }}>Checking...</span>;
  }

  if (attachments.length === 0) {
    return <span style={{ fontSize: 11.5, color: theme.textTertiary }}>None</span>;
  }

  return (
    <div style={{ display: 'grid', gap: 5, minWidth: 190, maxWidth: 260 }}>
      <span
        style={{
          width: 'fit-content',
          fontSize: 10,
          fontWeight: 800,
          fontFamily: theme.mono,
          padding: '2px 6px',
          borderRadius: 4,
          background: theme.primaryMuted,
          color: theme.primary,
        }}
      >
        {attachments.length} file{attachments.length === 1 ? '' : 's'}
      </span>
      {attachments.slice(0, 2).map((attachment) => (
        <div key={attachment.id} style={{ display: 'grid', gap: 5, whiteSpace: 'normal' }}>
          <div style={{ display: 'grid', gap: 1 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: theme.ink }}>
              {attachment.file_name}
            </span>
            <span style={{ fontSize: 10.5, color: theme.textTertiary, fontFamily: theme.mono }}>
              {attachment.doc_type} / {fmtBytes(Number(attachment.size_bytes))}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onDownload(attachment)}
            disabled={downloadingId === attachment.id}
            title={`Download ${attachment.file_name}`}
            style={{
              width: 'fit-content',
              minHeight: 26,
              border: `1px solid ${theme.borderStrong}`,
              borderRadius: 6,
              background: downloadUrls[attachment.id] ? theme.surface : theme.surfaceMuted,
              color: theme.primary,
              cursor: downloadingId === attachment.id ? 'wait' : 'pointer',
              padding: '4px 9px',
              fontSize: 11,
              fontWeight: 800,
              fontFamily: theme.mono,
            }}
          >
            {downloadingId === attachment.id
              ? 'Opening...'
              : downloadUrls[attachment.id]
                ? 'Download'
                : 'Prepare download'}
          </button>
          {!downloadUrls[attachment.id] && downloadingId !== attachment.id && (
            <span
              style={{
                fontSize: 10.5,
                color: theme.textTertiary,
                whiteSpace: 'normal',
              }}
            >
              Link is still being prepared.
            </span>
          )}
        </div>
      ))}
      {downloadUrlError && (
        <span role="alert" style={{ fontSize: 10.5, color: theme.danger, whiteSpace: 'normal' }}>
          {downloadUrlError}
        </span>
      )}
      {attachments.length > 2 && (
        <span style={{ fontSize: 10.5, color: theme.textTertiary }}>
          +{attachments.length - 2} more
        </span>
      )}
    </div>
  );
}

function FeedbackCell({
  event,
  response,
  onRequest,
}: {
  event: SourcingEvent;
  response?: FeedbackResponse;
  onRequest: () => void;
}) {
  if (response) {
    const average = ((response.toolScore + response.supportScore) / 2).toFixed(1);
    return (
      <div style={{ display: 'grid', gap: 4, minWidth: 170 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              fontFamily: theme.mono,
              padding: '2px 6px',
              borderRadius: 4,
              background: theme.successBg,
              color: theme.success,
            }}
          >
            NPS {average}
          </span>
          <span style={{ fontSize: 11, color: theme.textTertiary, fontFamily: theme.mono }}>
            Tool {response.toolScore} / Support {response.supportScore}
          </span>
        </div>
        {response.comment && (
          <span style={{ fontSize: 11.5, color: theme.textSecondary, whiteSpace: 'normal' }}>
            {response.comment}
          </span>
        )}
      </div>
    );
  }

  return (
    <Button
      variant="secondary"
      disabled={!canEmailFeedback(event)}
      onClick={onRequest}
      style={{
        height: 28,
        padding: '6px 10px',
        fontSize: 11.5,
        color: !canEmailFeedback(event) ? theme.textTertiary : theme.textSecondary,
      }}
    >
      {event.feedbackRequested ? 'Request again' : 'Request feedback'}
    </Button>
  );
}

export function RequestInbox({ events }: { events: SourcingEvent[] }) {
  const updateEventStatus = useStore((s) => s.updateEventStatus);
  const requestEventFeedback = useStore((s) => s.requestEventFeedback);
  const feedbackResponses = useStore((s) => s.feedbackResponses);
  const archiveEvent = useStore((s) => s.archiveEvent);
  const unarchiveEvent = useStore((s) => s.unarchiveEvent);
  const [filter, setFilter] = useState<'active' | 'new' | 'archived' | 'all'>('active');
  const [attachmentsByEvent, setAttachmentsByEvent] = useState<Record<string, AttachmentRow[]>>({});
  const [attachmentLoadError, setAttachmentLoadError] = useState<string | null>(null);
  const [attachmentDownloadUrls, setAttachmentDownloadUrls] = useState<Record<string, string>>({});
  const [downloadUrlError, setDownloadUrlError] = useState<string | null>(null);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<string | null>(null);

  const requests = useMemo(
    () =>
      events
        .filter((e) => !!e.requestCreatedAt)
        .sort((a, b) => (b.requestCreatedAt ?? '').localeCompare(a.requestCreatedAt ?? '')),
    [events],
  );

  const visible = useMemo(() => {
    if (filter === 'new') {
      return requests.filter((e) => !e.archivedAt && (e.status === 'Planned' || e.status === 'Live'));
    }
    if (filter === 'archived') return requests.filter((e) => !!e.archivedAt);
    if (filter === 'all') return requests;
    return requests.filter((e) => !e.archivedAt);
  }, [requests, filter]);

  const totalSpend = visible.reduce((sum, e) => sum + (e.addressable || 0), 0);
  const activeCount = requests.filter((e) => !e.archivedAt).length;
  const archivedCount = requests.length - activeCount;

  useEffect(() => {
    const eventIds = requests.map((event) => event.id);
    let cancelled = false;

    if (eventIds.length === 0) {
      setAttachmentsByEvent({});
      setAttachmentDownloadUrls({});
      setAttachmentLoadError(null);
      setDownloadUrlError(null);
      return () => {
        cancelled = true;
      };
    }

    setAttachmentLoadError(null);
    setDownloadUrlError(null);
    void listAttachmentsForEvents(eventIds)
      .then(async (grouped) => {
        if (cancelled) return;
        setAttachmentsByEvent(grouped);

        const rows = Object.values(grouped).flat();
        const nextUrls: Record<string, string> = {};
        const failures: string[] = [];
        await Promise.all(
          rows.map(async (attachment) => {
            try {
              nextUrls[attachment.id] = await createAttachmentDownloadUrl(attachment);
            } catch (err) {
              console.error('[request-inbox] failed to prepare attachment link', err);
              failures.push(attachment.file_name);
            }
          }),
        );

        if (!cancelled) {
          setAttachmentDownloadUrls(nextUrls);
          setDownloadUrlError(failures.length ? 'Download link unavailable.' : null);
        }
      })
      .catch((err) => {
        console.error('[request-inbox] failed to load attachments', err);
        if (!cancelled) {
          setAttachmentsByEvent({});
          setAttachmentDownloadUrls({});
          setAttachmentLoadError((err as Error).message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [requests]);

  const downloadAttachment = async (attachment: AttachmentRow) => {
    setDownloadUrlError(null);
    setDownloadingAttachmentId(attachment.id);
    try {
      const url = attachmentDownloadUrls[attachment.id] ?? await createAttachmentDownloadUrl(attachment);
      setAttachmentDownloadUrls((prev) => ({ ...prev, [attachment.id]: url }));
      window.location.assign(url);
    } catch (err) {
      console.error('[request-inbox] failed to open attachment', err);
      setDownloadUrlError(err instanceof Error ? err.message : 'Download link unavailable.');
    } finally {
      setDownloadingAttachmentId(null);
    }
  };

  return (
    <Card pad={0}>
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
        <CardTitle sub={`${requests.length} request${requests.length === 1 ? '' : 's'} received from users`}>
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
            {(['active', 'new', 'archived', 'all'] as const).map((f) => {
              const active = filter === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
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
                  {f === 'new'
                    ? 'Open'
                    : f === 'active'
                      ? `Active (${activeCount})`
                      : f === 'archived'
                        ? `Archived (${archivedCount})`
                        : 'All'}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto', maxHeight: 600 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1280 }}>
          <thead>
            <tr>
              <th style={th}>Received</th>
              <th style={th}>Requestor</th>
              <th style={th}>Event</th>
              <th style={th}>Category</th>
              <th style={{ ...th, textAlign: 'right' }}>Addressable</th>
              <th style={th}>Status</th>
              <th style={th}>Attachments</th>
              <th style={th}>Feedback</th>
              <th style={th}> </th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ ...td, textAlign: 'center', color: theme.textTertiary, padding: 32 }}>
                  No user requests received yet.
                </td>
              </tr>
            ) : (
              visible.map((e) => {
                const cat = CATEGORY_BY_NAME[e.category];
                const isFresh =
                  e.requestCreatedAt &&
                  !e.archivedAt &&
                  Date.now() - new Date(e.requestCreatedAt).getTime() < 24 * 60 * 60 * 1000;
                return (
                  <tr key={e.id}>
                    <td style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {isFresh && (
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 800,
                              fontFamily: theme.mono,
                              padding: '2px 5px',
                              borderRadius: 3,
                              background: theme.primary,
                              color: '#fff',
                            }}
                          >
                            NEW
                          </span>
                        )}
                        {e.archivedAt && (
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 800,
                              fontFamily: theme.mono,
                              padding: '2px 5px',
                              borderRadius: 3,
                              background: theme.surfaceMuted,
                              color: theme.textTertiary,
                              border: `1px solid ${theme.border}`,
                            }}
                          >
                            ARCHIVED
                          </span>
                        )}
                        <span style={{ fontFamily: theme.mono, fontSize: 11.5, color: theme.textSecondary }}>
                          {fmtReceivedAt(e.requestCreatedAt)}
                        </span>
                      </div>
                    </td>
                    <td style={td}>
                      <span style={{ fontSize: 12, color: theme.textSecondary, fontFamily: theme.mono }}>
                        {e.requestor ?? '-'}
                      </span>
                    </td>
                    <td style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: 2,
                            background: cat?.color,
                            flexShrink: 0,
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 600 }}>{e.name}</div>
                          <div
                            style={{
                              fontSize: 10.5,
                              color: theme.textTertiary,
                              fontFamily: theme.mono,
                            }}
                          >
                            {e.id} · {e.fy} · {(e.regions ?? [e.region]).join(', ')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={td}>
                      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
                        <span style={{ fontWeight: 600 }}>{e.category}</span>
                        <span style={{ fontSize: 11, color: theme.textTertiary }}>{e.subcategory}</span>
                      </div>
                    </td>
                    <td style={num}>{fmtUSD(e.addressable)}</td>
                    <td style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <StatusBadge status={e.status} />
                        <select
                          className="ui-select"
                          aria-label={`Change status for ${e.name}`}
                          value={e.status}
                          onChange={(event) => updateEventStatus(e.id, event.target.value as Status)}
                          style={{
                            width: 124,
                            height: 30,
                            fontSize: 11.5,
                            fontWeight: 700,
                            paddingLeft: 9,
                          }}
                        >
                          {STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td style={td}>
                      <AttachmentsCell
                        attachments={attachmentsByEvent[e.id]}
                        error={attachmentLoadError}
                        downloadUrls={attachmentDownloadUrls}
                        downloadUrlError={downloadUrlError}
                        downloadingId={downloadingAttachmentId}
                        onDownload={(attachment) => void downloadAttachment(attachment)}
                      />
                    </td>
                    <td style={td}>
                      <FeedbackCell
                        event={e}
                        response={feedbackResponses.find((response) => response.eventId === e.id)}
                        onRequest={() => {
                          if (openFeedbackEmail(e)) void requestEventFeedback(e.id);
                        }}
                      />
                    </td>
                    <td style={td}>
                      {e.archivedAt ? (
                        <Button
                          variant="ghost"
                          onClick={() => void unarchiveEvent(e.id)}
                          style={{
                            height: 28,
                            padding: '6px 9px',
                            fontSize: 11.5,
                            color: theme.textSecondary,
                          }}
                        >
                          Restore
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          onClick={() => {
                            const ok = window.confirm(
                              `Archive ${e.id}? It will leave the active inbox but remain available for audit.`,
                            );
                            if (ok) void archiveEvent(e.id);
                          }}
                          style={{
                            height: 28,
                            padding: '6px 9px',
                            fontSize: 11.5,
                            color: theme.textSecondary,
                          }}
                        >
                          Archive
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
