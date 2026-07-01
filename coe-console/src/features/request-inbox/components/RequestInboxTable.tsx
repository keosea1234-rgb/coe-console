import type { CSSProperties } from 'react';
import { Card } from '../../../components/common/Card';
import type { AttachmentRow } from '../../../domain/attachments';
import type { Status } from '../../../domain/constants';
import { CATEGORY_BY_NAME } from '../../../domain/categories';
import type { FeedbackResponse, SourcingEvent } from '../../../domain/types';
import { fmtUSD } from '../../../domain/selectors';
import { theme } from '../../../styles/theme';
import { AttachmentList } from './AttachmentList';
import {
  RequestActionMenu,
  RequestFeedbackAction,
  RequestStatusControl,
} from './RequestActionMenu';
import { RequestInboxFilters } from './RequestInboxFilters';
import { formatReceivedAt, isFreshRequest } from '../hooks/useRequestInboxFilters';
import type { RequestInboxActionState, RequestInboxFilter } from '../model/requestInbox.types';

const th: CSSProperties = {
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

const td: CSSProperties = {
  fontSize: 12.5,
  padding: '10px 12px',
  borderBottom: `1px solid ${theme.border}`,
  whiteSpace: 'nowrap',
  color: theme.ink,
};

const num: CSSProperties = {
  ...td,
  fontFamily: theme.mono,
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
};

function isBusy(
  actionState: RequestInboxActionState | null,
  eventId: string,
  kinds: RequestInboxActionState['kind'][],
) {
  return !!actionState && actionState.eventId === eventId && kinds.includes(actionState.kind);
}

export function RequestInboxTable({
  requests,
  visible,
  filter,
  totalSpend,
  activeCount,
  archivedCount,
  actionError,
  feedbackResponses,
  attachmentsByEvent,
  attachmentLoadError,
  attachmentDownloadUrls,
  downloadUrlError,
  downloadingAttachmentId,
  actionState,
  onFilterChange,
  onSelectRequest,
  onDownloadAttachment,
  onRequestFeedback,
  onUpdateStatus,
  onRejectArchive,
  onRestoreRequest,
}: {
  requests: SourcingEvent[];
  visible: SourcingEvent[];
  filter: RequestInboxFilter;
  totalSpend: number;
  activeCount: number;
  archivedCount: number;
  actionError: string | null;
  feedbackResponses: FeedbackResponse[];
  attachmentsByEvent: Record<string, AttachmentRow[]>;
  attachmentLoadError: string | null;
  attachmentDownloadUrls: Record<string, string>;
  downloadUrlError: string | null;
  downloadingAttachmentId: string | null;
  actionState: RequestInboxActionState | null;
  onFilterChange: (filter: RequestInboxFilter) => void;
  onSelectRequest: (eventId: string) => void;
  onDownloadAttachment: (attachment: AttachmentRow) => void;
  onRequestFeedback: (event: SourcingEvent) => void;
  onUpdateStatus: (eventId: string, status: Status) => void;
  onRejectArchive: (eventId: string) => void;
  onRestoreRequest: (eventId: string) => void;
}) {
  return (
    <Card
      pad={0}
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'clamp(520px, calc(100vh - 220px), 680px)',
      }}
    >
      <RequestInboxFilters
        requestCount={requests.length}
        filter={filter}
        totalSpend={totalSpend}
        activeCount={activeCount}
        archivedCount={archivedCount}
        onFilterChange={onFilterChange}
      />

      {actionError && (
        <div
          role="alert"
          style={{
            margin: '0 18px 10px',
            padding: '9px 12px',
            borderRadius: theme.radiusSm,
            background: theme.dangerBg,
            border: `1px solid ${theme.danger}40`,
            color: theme.danger,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {actionError}
        </div>
      )}

      <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1, minHeight: 0 }}>
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
              visible.map((event) => {
                const category = CATEGORY_BY_NAME[event.category];
                return (
                  <tr
                    key={event.id}
                    onClick={() => onSelectRequest(event.id)}
                    title="Open request"
                    style={{ cursor: 'pointer' }}
                    className="my-request-row"
                  >
                    <td style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {isFreshRequest(event) && (
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
                        {event.archivedAt && (
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
                          {formatReceivedAt(event.requestCreatedAt)}
                        </span>
                      </div>
                    </td>
                    <td style={td}>
                      <span style={{ fontSize: 12, color: theme.textSecondary, fontFamily: theme.mono }}>
                        {event.requestor ?? '-'}
                      </span>
                    </td>
                    <td style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: 2,
                            background: category?.color,
                            flexShrink: 0,
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 600 }}>{event.name}</div>
                          <div style={{ fontSize: 10.5, color: theme.textTertiary, fontFamily: theme.mono }}>
                            {event.id} - {event.fy} - {(event.regions ?? [event.region]).join(', ')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={td}>
                      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
                        <span style={{ fontWeight: 600 }}>{event.category}</span>
                        <span style={{ fontSize: 11, color: theme.textTertiary }}>{event.subcategory}</span>
                      </div>
                    </td>
                    <td style={num}>{fmtUSD(event.addressable)}</td>
                    <td style={td} onClick={(clickEvent) => clickEvent.stopPropagation()}>
                      <RequestStatusControl
                        event={event}
                        busy={isBusy(actionState, event.id, ['update-status', 'approve'])}
                        onStatusChange={onUpdateStatus}
                      />
                    </td>
                    <td style={td} onClick={(clickEvent) => clickEvent.stopPropagation()}>
                      <AttachmentList
                        attachments={attachmentsByEvent[event.id]}
                        error={attachmentLoadError}
                        downloadUrls={attachmentDownloadUrls}
                        downloadUrlError={downloadUrlError}
                        downloadingId={downloadingAttachmentId}
                        onDownload={onDownloadAttachment}
                      />
                    </td>
                    <td style={td} onClick={(clickEvent) => clickEvent.stopPropagation()}>
                      <RequestFeedbackAction
                        event={event}
                        response={feedbackResponses.find((response) => response.eventId === event.id)}
                        busy={isBusy(actionState, event.id, ['request-feedback'])}
                        onRequest={() => onRequestFeedback(event)}
                      />
                    </td>
                    <td style={td} onClick={(clickEvent) => clickEvent.stopPropagation()}>
                      <RequestActionMenu
                        event={event}
                        busy={isBusy(actionState, event.id, ['reject', 'restore'])}
                        onRejectArchive={onRejectArchive}
                        onRestore={onRestoreRequest}
                      />
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
