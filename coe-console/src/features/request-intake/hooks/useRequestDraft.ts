import { useCallback, useEffect, useState } from 'react';
import {
  REQUEST_DRAFT_KEY,
  type RequestDraft,
  type RequestDraftFields,
} from '../model/requestIntake.types';

interface UseRequestDraftArgs {
  draftFields: RequestDraftFields;
  saved: boolean;
  restoreDraft: (draft: Partial<RequestDraft>) => void;
}

export function formatDraftSavedAt(iso: string | null) {
  if (!iso) return 'Not saved yet';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Draft saved';
  return `Draft saved ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
}

export function createRequestDraft(fields: RequestDraftFields, savedAt: string): RequestDraft {
  return {
    ...fields,
    savedAt,
  };
}

export function parseStoredRequestDraft(raw: string): {
  draft: Partial<RequestDraft> | null;
  error: unknown | null;
} {
  try {
    const draft = JSON.parse(raw);
    if (!draft || typeof draft !== 'object') {
      return { draft: null, error: new Error('Stored request draft is not an object.') };
    }
    return { draft: draft as Partial<RequestDraft>, error: null };
  } catch (error) {
    return { draft: null, error };
  }
}

export function useRequestDraft({ draftFields, saved, restoreDraft }: UseRequestDraftArgs) {
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);

  const discardDraft = useCallback(() => {
    window.localStorage.removeItem(REQUEST_DRAFT_KEY);
    setDraftSavedAt(null);
    setDraftRestored(false);
  }, []);

  useEffect(() => {
    const raw = window.localStorage.getItem(REQUEST_DRAFT_KEY);
    if (!raw) {
      setDraftLoaded(true);
      return;
    }

    const { draft, error } = parseStoredRequestDraft(raw);
    if (draft) {
      restoreDraft(draft);
      setDraftSavedAt(draft.savedAt ?? null);
      setDraftRestored(true);
    } else if (error) {
      console.warn('[request-form] failed to restore draft', error);
      window.localStorage.removeItem(REQUEST_DRAFT_KEY);
    }
    setDraftLoaded(true);
  }, [restoreDraft]);

  useEffect(() => {
    if (saved) discardDraft();
  }, [discardDraft, saved]);

  useEffect(() => {
    if (!draftLoaded || saved) return;
    const handle = window.setTimeout(() => {
      const savedAt = new Date().toISOString();
      const draft = createRequestDraft(draftFields, savedAt);
      window.localStorage.setItem(REQUEST_DRAFT_KEY, JSON.stringify(draft));
      setDraftSavedAt(savedAt);
    }, 600);

    return () => window.clearTimeout(handle);
  }, [draftFields, draftLoaded, saved]);

  return {
    draftSavedAt,
    draftRestored,
    clearDraft: discardDraft,
    formatDraftSavedAt,
  };
}
