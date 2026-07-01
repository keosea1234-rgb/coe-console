import { Card, CardTitle } from '../../../components/common/Card';
import { Button } from '../../../components/common/primitives';
import { RequestConversation } from '../../../components/console/RequestConversation';
import type { AttachmentRow } from '../../../domain/attachments';
import type { Status } from '../../../domain/constants';
import type { SessionUser } from '../../../domain/session';
import type { FeedbackResponse, RequestUpdate, SourcingEvent } from '../../../domain/types';
import { CATEGORY_BY_NAME } from '../../../domain/categories';
import { fmtUSD } from '../../../domain/selectors';
import { scopeLine } from '../../../lib/coeRequestEmail';
import { sectionLabel, theme } from '../../../styles/theme';
import { AttachmentList } from './AttachmentList';
import {
  RequestActionMenu,
  RequestFeedbackAction,
  RequestStatusControl,
} from './RequestActionMenu';
import { formatReceivedAt } from '../hooks/useRequestInboxFilters';
import type { RequestInboxActionState } from '../model/requestInbox.types';

function isBusy(
  actionState: RequestInboxActionState | null,
  eventId: string,
  kinds: RequestInboxActionState['kind'][],
) {
  return !!actionState && actionState.eventId === eventId && kinds.includes(actionState.kind);
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        padding: '9px 0',
        borderBottom: `1px solid ${theme.border}`,
      }}
    >
      <span style={{ fontSize: 11.5, color: theme.textTertiary, fontFamily: theme.mono }}>{label}</span>
      <span style={{ fontSize: 12.5, color: theme.ink, fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

export function RequestInboxWorkspace({
  event,
  actionError,
  actionState,
  onBack,
  attachments,
  attachmentLoadError,
  downloadUrls,
  downloadUrlError,
  downloadingId,
  onDownload,
  feedbackResponse,
  onRequestFeedback,
  onStatusChange,
  onRejectArchive,
  onRestore,
  updates,
  currentUser,
  onPostUpdate,
}: {
  event: SourcingEvent;
  actionError: string | null;
  actionState: RequestInboxActionState | null;
  onBack: () => void;
  attachments?: AttachmentRow[];
  attachmentLoadError: string | null;
  downloadUrls: Record<string, string>;
  downloadUrlError: string | null;
  downloadingId: string | null;
  onDownload: (attachment: AttachmentRow) => void;
  feedbackResponse?: FeedbackResponse;
  onRequestFeedback: (event: SourcingEvent) => void;
  onStatusChange: (id: string, status: Status) => void;
  onRejectArchive: (id: string) => void;
  onRestore: (id: string) => void;
  updates: RequestUpdate[];
  currentUser: SessionUser | null;
  onPostUpdate: (eventId: string, body: string) => Promise<{ error: string | null }>;
}) {
  const category = CATEGORY_BY_NAME[event.category];
  const badges = [
    event.directness,
    event.shouldCostModeling ? 'Should-cost' : undefined,
    event.riskAssessment ? 'Risk' : undefined,
    event.esgAssessment ? 'ESG' : undefined,
  ].filter(Boolean) as string[];

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card pad={0}>
        <div
          style={{
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <Button variant="ghost" onClick={onBack} style={{ height: 30, padding: '6px 10px', fontSize: 12 }}>
              Back
            </Button>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: category?.color ?? theme.primary,
                flexShrink: 0,
              }}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 850, color: theme.ink, lineHeight: 1.2 }}>
                {event.name}
              </div>
              <div style={{ marginTop: 3, fontSize: 11.5, color: theme.textTertiary, fontFamily: theme.mono }}>
                {event.id} / {formatReceivedAt(event.requestCreatedAt)}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <RequestStatusControl
              event={event}
              busy={isBusy(actionState, event.id, ['update-status', 'approve'])}
              onStatusChange={onStatusChange}
            />
            <RequestActionMenu
              event={event}
              busy={isBusy(actionState, event.id, ['reject', 'restore'])}
              onRejectArchive={onRejectArchive}
              onRestore={onRestore}
            />
          </div>
        </div>
        {actionError && (
          <div
            role="alert"
            style={{
              margin: '0 18px 16px',
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
      </Card>

      <div className="request-workspace-grid">
        <Card pad={0} style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px', borderBottom: `1px solid ${theme.border}` }}>
            <CardTitle sub={event.requestor ?? 'No requestor email'}>Request details</CardTitle>
          </div>
          <div style={{ padding: '4px 18px 18px', display: 'grid', gap: 16 }}>
            <div>
              <DetailRow label="Requestor" value={event.requestor ?? '-'} />
              <DetailRow label="Scope" value={scopeLine(event)} />
              <DetailRow label="Category" value={`${event.category} / ${event.subcategory}`} />
              <DetailRow label="Addressable" value={fmtUSD(event.addressable)} />
              {badges.length > 0 && (
                <div style={{ paddingTop: 10, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {badges.map((badge) => (
                    <span
                      key={badge}
                      style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        fontFamily: theme.mono,
                        padding: '2px 6px',
                        borderRadius: 4,
                        color: theme.textSecondary,
                        background: theme.surfaceMuted,
                        border: `1px solid ${theme.border}`,
                      }}
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              <div style={sectionLabel}>Attachments</div>
              <AttachmentList
                attachments={attachments}
                error={attachmentLoadError}
                downloadUrls={downloadUrls}
                downloadUrlError={downloadUrlError}
                downloadingId={downloadingId}
                onDownload={onDownload}
              />
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              <div style={sectionLabel}>Feedback</div>
              <RequestFeedbackAction
                event={event}
                response={feedbackResponse}
                busy={isBusy(actionState, event.id, ['request-feedback'])}
                onRequest={() => onRequestFeedback(event)}
              />
            </div>
          </div>
        </Card>

        <RequestConversation
          event={event}
          updates={updates}
          currentUser={currentUser}
          onPost={onPostUpdate}
          style={{ minHeight: 'clamp(480px, calc(100vh - 284px), 700px)' }}
        />
      </div>
    </div>
  );
}
