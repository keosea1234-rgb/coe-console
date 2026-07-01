import type { SourcingEvent } from '../../domain/types';
import { RequestInboxTable } from './components/RequestInboxTable';
import { RequestInboxWorkspace } from './components/RequestInboxWorkspace';
import { useRequestInbox } from './hooks/useRequestInbox';

export function RequestInboxFeature({ events }: { events: SourcingEvent[] }) {
  const inbox = useRequestInbox(events);

  if (inbox.detailEvent) {
    return (
      <RequestInboxWorkspace
        event={inbox.detailEvent}
        actionError={inbox.actionError}
        actionState={inbox.actionState}
        onBack={() => inbox.setSelectedId(null)}
        attachments={inbox.attachmentsByEvent[inbox.detailEvent.id]}
        attachmentLoadError={inbox.attachmentLoadError}
        downloadUrls={inbox.attachmentDownloadUrls}
        downloadUrlError={inbox.downloadUrlError}
        downloadingId={inbox.downloadingAttachmentId}
        onDownload={(attachment) => void inbox.downloadAttachment(attachment)}
        feedbackResponse={inbox.feedbackResponses.find((response) => response.eventId === inbox.detailEvent?.id)}
        onRequestFeedback={(event) => void inbox.requestFeedback(event)}
        onStatusChange={(eventId, status) => void inbox.updateStatus(eventId, status)}
        onRejectArchive={(eventId) => void inbox.rejectArchiveRequest(eventId)}
        onRestore={(eventId) => void inbox.restoreRequest(eventId)}
        updates={inbox.detailUpdates}
        currentUser={inbox.currentUser}
        onPostUpdate={(eventId, body) => inbox.addRequestUpdate({ eventId, body })}
      />
    );
  }

  return (
    <RequestInboxTable
      requests={inbox.requests}
      visible={inbox.visible}
      filter={inbox.filter}
      totalSpend={inbox.totalSpend}
      activeCount={inbox.activeCount}
      archivedCount={inbox.archivedCount}
      actionError={inbox.actionError}
      feedbackResponses={inbox.feedbackResponses}
      attachmentsByEvent={inbox.attachmentsByEvent}
      attachmentLoadError={inbox.attachmentLoadError}
      attachmentDownloadUrls={inbox.attachmentDownloadUrls}
      downloadUrlError={inbox.downloadUrlError}
      downloadingAttachmentId={inbox.downloadingAttachmentId}
      actionState={inbox.actionState}
      onFilterChange={inbox.setFilter}
      onSelectRequest={inbox.setSelectedId}
      onDownloadAttachment={(attachment) => void inbox.downloadAttachment(attachment)}
      onRequestFeedback={(event) => void inbox.requestFeedback(event)}
      onUpdateStatus={(eventId, status) => void inbox.updateStatus(eventId, status)}
      onRejectArchive={(eventId) => void inbox.rejectArchiveRequest(eventId)}
      onRestoreRequest={(eventId) => void inbox.restoreRequest(eventId)}
    />
  );
}
