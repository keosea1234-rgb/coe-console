import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Status } from '../../../domain/constants';
import {
  createAttachmentDownloadUrl,
  listAttachmentsForEvents,
  type AttachmentRow,
} from '../../../domain/attachments';
import { useSession } from '../../../domain/session';
import { useStore } from '../../../domain/store';
import type { SourcingEvent } from '../../../domain/types';
import { openFeedbackEmail } from '../../../lib/feedbackEmail';
import { useRequestInboxFilters } from './useRequestInboxFilters';
import type {
  RequestInboxActionKind,
  RequestInboxActionOptions,
  RequestInboxActionState,
} from '../model/requestInbox.types';

const ACTION_ERRORS: Record<RequestInboxActionKind, string> = {
  approve: 'Unable to accept this request right now.',
  reject: 'Unable to archive this request right now.',
  'request-feedback': 'Unable to request feedback right now.',
  restore: 'Unable to restore this request right now.',
  'update-status': 'Unable to update this request status right now.',
};

export async function runRequestInboxAction({
  eventId,
  kind,
  action,
  setActionState,
  setActionError,
  safeError,
  clearError,
  getStoreError,
}: RequestInboxActionOptions): Promise<boolean> {
  setActionState({ eventId, kind });
  setActionError(null);
  clearError?.();

  try {
    await action();
    if (getStoreError?.()) {
      setActionError(safeError);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[request-inbox] admin action failed', err);
    setActionError(safeError);
    return false;
  } finally {
    setActionState(null);
  }
}

export async function resolveAttachmentDownloadUrl(
  attachment: AttachmentRow,
  downloadUrls: Record<string, string>,
  createUrl: (attachment: AttachmentRow) => Promise<string> = createAttachmentDownloadUrl,
): Promise<{ url: string; generated: boolean }> {
  const cached = downloadUrls[attachment.id];
  if (cached) return { url: cached, generated: false };
  return { url: await createUrl(attachment), generated: true };
}

export function useRequestInbox(events: SourcingEvent[]) {
  const filters = useRequestInboxFilters(events);
  const updateEventStatus = useStore((state) => state.updateEventStatus);
  const requestEventFeedback = useStore((state) => state.requestEventFeedback);
  const feedbackResponses = useStore((state) => state.feedbackResponses);
  const archiveEvent = useStore((state) => state.archiveEvent);
  const unarchiveEvent = useStore((state) => state.unarchiveEvent);
  const requestUpdates = useStore((state) => state.requestUpdates);
  const addRequestUpdate = useStore((state) => state.addRequestUpdate);
  const clearError = useStore((state) => state.clearError);
  const currentUser = useSession((state) => state.user);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [attachmentsByEvent, setAttachmentsByEvent] = useState<Record<string, AttachmentRow[]>>({});
  const [attachmentLoadError, setAttachmentLoadError] = useState<string | null>(null);
  const [attachmentDownloadUrls, setAttachmentDownloadUrls] = useState<Record<string, string>>({});
  const [downloadUrlError, setDownloadUrlError] = useState<string | null>(null);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<string | null>(null);
  const [actionState, setActionState] = useState<RequestInboxActionState | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const eventIds = filters.requests.map((event) => event.id);
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
    void listAttachmentsForEvents(eventIds)
      .then((grouped) => {
        if (!cancelled) setAttachmentsByEvent(grouped);
      })
      .catch((err) => {
        console.error('[request-inbox] failed to load attachments', err);
        if (!cancelled) {
          setAttachmentsByEvent({});
          setAttachmentLoadError('Unable to load attachments.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [filters.requests]);

  const runAction = useCallback(
    (eventId: string, kind: RequestInboxActionKind, action: () => Promise<void>) =>
      runRequestInboxAction({
        eventId,
        kind,
        action,
        setActionState,
        setActionError,
        safeError: ACTION_ERRORS[kind],
        clearError,
        getStoreError: () => useStore.getState().error,
      }),
    [clearError],
  );

  const approveRequest = useCallback(
    (eventId: string) => runAction(eventId, 'approve', () => updateEventStatus(eventId, 'Live')),
    [runAction, updateEventStatus],
  );

  const rejectArchiveRequest = useCallback(
    (eventId: string) => runAction(eventId, 'reject', () => archiveEvent(eventId)),
    [archiveEvent, runAction],
  );

  const restoreRequest = useCallback(
    (eventId: string) => runAction(eventId, 'restore', () => unarchiveEvent(eventId)),
    [runAction, unarchiveEvent],
  );

  const updateStatus = useCallback(
    (eventId: string, status: Status) =>
      runAction(eventId, 'update-status', () => updateEventStatus(eventId, status)),
    [runAction, updateEventStatus],
  );

  const requestFeedback = useCallback(
    (event: SourcingEvent) => {
      if (!openFeedbackEmail(event)) return Promise.resolve(false);
      return runAction(event.id, 'request-feedback', () => requestEventFeedback(event.id));
    },
    [requestEventFeedback, runAction],
  );

  const downloadAttachment = useCallback(
    async (attachment: AttachmentRow) => {
      setDownloadUrlError(null);
      setDownloadingAttachmentId(attachment.id);
      try {
        const { url } = await resolveAttachmentDownloadUrl(attachment, attachmentDownloadUrls);
        setAttachmentDownloadUrls((prev) => ({ ...prev, [attachment.id]: url }));
        window.location.assign(url);
      } catch (err) {
        console.error('[request-inbox] failed to open attachment', err);
        setDownloadUrlError('Download link unavailable. Please try again.');
      } finally {
        setDownloadingAttachmentId(null);
      }
    },
    [attachmentDownloadUrls],
  );

  const detailEvent = selectedId ? events.find((event) => event.id === selectedId) ?? null : null;
  const detailUpdates = useMemo(
    () => (detailEvent ? requestUpdates.filter((update) => update.eventId === detailEvent.id) : []),
    [detailEvent, requestUpdates],
  );

  return {
    ...filters,
    selectedId,
    setSelectedId,
    detailEvent,
    detailUpdates,
    currentUser,
    feedbackResponses,
    attachmentsByEvent,
    attachmentLoadError,
    attachmentDownloadUrls,
    downloadUrlError,
    downloadingAttachmentId,
    actionState,
    actionError,
    approveRequest,
    rejectArchiveRequest,
    requestFeedback,
    restoreRequest,
    updateStatus,
    downloadAttachment,
    addRequestUpdate,
  };
}
