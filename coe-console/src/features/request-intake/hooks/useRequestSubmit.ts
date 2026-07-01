import { useCallback, useState, type Dispatch, type FormEvent, type SetStateAction } from 'react';
import { uploadAttachment } from '../../../domain/attachments';
import { prefersAmcorEmail } from '../../../domain/eventFormHelpers';
import {
  buildRequestEvent,
  validateRequestEventInput,
  type RequestEventInput,
  type RequestValidationErrors,
} from '../../../domain/requestIntake';
import type { SourcingEvent } from '../../../domain/types';
import type {
  AttachmentRow,
  UploadFailure,
  UploadProgress,
  UploadStatus,
} from '../model/requestIntake.types';

interface UseRequestSubmitArgs {
  saved: boolean;
  setSaved: Dispatch<SetStateAction<boolean>>;
  events: SourcingEvent[];
  attachments: AttachmentRow[];
  sessionUserId?: string;
  addEvent: (event: SourcingEvent) => Promise<void>;
  currentRequestInput: () => RequestEventInput;
  setErrors: Dispatch<SetStateAction<RequestValidationErrors>>;
  setEmailHint: Dispatch<SetStateAction<string | undefined>>;
  setUploadStatus: Dispatch<SetStateAction<UploadStatus>>;
  setUploadProgress: Dispatch<SetStateAction<UploadProgress | null>>;
  setUploadFailures: Dispatch<SetStateAction<UploadFailure[]>>;
  onSaved: () => void;
  navigateHome: () => void;
}

export function useRequestSubmit({
  saved,
  setSaved,
  events,
  attachments,
  sessionUserId,
  addEvent,
  currentRequestInput,
  setErrors,
  setEmailHint,
  setUploadStatus,
  setUploadProgress,
  setUploadFailures,
  onSaved,
  navigateHome,
}: UseRequestSubmitArgs) {
  const [submitting, setSubmitting] = useState(false);

  const validate = useCallback(() => {
    const input = currentRequestInput();
    const next = validateRequestEventInput(input, events);
    setErrors(next);
    if (!next.requestorEmail && input.requestorEmail && !prefersAmcorEmail(input.requestorEmail)) {
      setEmailHint('Prefer an @amcor.com address when available.');
    } else {
      setEmailHint(undefined);
    }

    return Object.keys(next).length === 0;
  }, [currentRequestInput, events, setEmailHint, setErrors]);

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (submitting || saved) return;
      if (!validate()) return;

      if (attachments.some((attachment) => attachment.error)) {
        setErrors((prev) => ({
          ...prev,
          attachments: 'Remove or replace invalid attachments before saving.',
        }));
        return;
      }

      setSubmitting(true);
      try {
        const requestInput = currentRequestInput();
        const sourcingEvent = buildRequestEvent(requestInput, new Date().toISOString());

        try {
          await addEvent(sourcingEvent);
        } catch (err) {
          setErrors({ submit: err instanceof Error ? err.message : 'Failed to save event.' });
          return;
        }

        const uploadable = attachments.filter((attachment) => !attachment.error);
        const failures: UploadFailure[] = [];

        if (uploadable.length > 0 && sessionUserId) {
          setUploadStatus('uploading');
          setUploadProgress({ done: 0, total: uploadable.length });
          for (let i = 0; i < uploadable.length; i++) {
            const row = uploadable[i];
            try {
              await uploadAttachment({
                eventId: sourcingEvent.id,
                docType: row.docType,
                file: row.file,
                uploaderId: sessionUserId,
              });
            } catch (err) {
              failures.push({
                name: row.file.name,
                message: err instanceof Error ? err.message : 'Upload failed.',
              });
            }
            setUploadProgress({ done: i + 1, total: uploadable.length });
          }
          setUploadFailures(failures);
          setUploadStatus(failures.length === 0 ? 'idle' : 'partial-failure');
        }

        if (failures.length > 0) {
          return;
        }

        onSaved();
        setSaved(true);
        window.setTimeout(navigateHome, 600);
      } finally {
        setSubmitting(false);
      }
    },
    [
      addEvent,
      attachments,
      currentRequestInput,
      navigateHome,
      onSaved,
      saved,
      sessionUserId,
      setErrors,
      setUploadFailures,
      setUploadProgress,
      setUploadStatus,
      submitting,
      validate,
    ],
  );

  return {
    saved,
    submitting,
    handleSubmit,
  };
}
