import { supabase } from '../lib/supabase';
import type { Database } from './database.types';

export const ATTACHMENT_BUCKET = 'request-attachments';

export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/png',
  'image/jpeg',
  'text/csv',
  'text/plain',
] as const;

export const ALLOWED_ATTACHMENT_EXTENSIONS = [
  '.pdf',
  '.xlsx',
  '.xls',
  '.docx',
  '.doc',
  '.png',
  '.jpg',
  '.jpeg',
  '.csv',
  '.txt',
] as const;

export type AttachmentRow = Database['public']['Tables']['event_attachments']['Row'];

export interface AttachmentUploadInput {
  eventId: string;
  docType: string;
  file: File;
  uploaderId: string;
}

export type AttachmentValidationCode =
  | 'too-large'
  | 'unsupported-type'
  | 'empty-file'
  | 'name-too-long';

export interface AttachmentValidationError {
  code: AttachmentValidationCode;
  message: string;
}

const ALLOWED_MIMES = new Set<string>(ALLOWED_ATTACHMENT_MIME_TYPES);
const ALLOWED_EXTS = new Set<string>(ALLOWED_ATTACHMENT_EXTENSIONS);

function extensionOf(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx === -1 ? '' : name.slice(idx).toLowerCase();
}

export function validateAttachmentFile(file: File): AttachmentValidationError | null {
  if (file.size === 0) {
    return { code: 'empty-file', message: `${file.name} is empty.` };
  }
  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return {
      code: 'too-large',
      message: `${file.name} exceeds the 10 MB limit.`,
    };
  }
  if (file.name.length > 200) {
    return {
      code: 'name-too-long',
      message: `${file.name.slice(0, 40)}… file name is too long (max 200 chars).`,
    };
  }
  const mime = file.type || '';
  const ext = extensionOf(file.name);
  const mimeAllowed = mime ? ALLOWED_MIMES.has(mime) : true;
  const extAllowed = ext ? ALLOWED_EXTS.has(ext) : false;
  if (!mimeAllowed || !extAllowed) {
    return {
      code: 'unsupported-type',
      message: `${file.name} is not a supported file type.`,
    };
  }
  return null;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 180);
}

export function buildStoragePath(eventId: string, fileName: string): string {
  const safeEvent = eventId.replace(/[^a-zA-Z0-9._-]+/g, '_');
  const safeName = sanitizeFileName(fileName);
  const uid = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  return `${safeEvent}/${uid}-${safeName}`;
}

export async function uploadAttachment(input: AttachmentUploadInput): Promise<AttachmentRow> {
  const validation = validateAttachmentFile(input.file);
  if (validation) throw new Error(validation.message);

  const path = buildStoragePath(input.eventId, input.file.name);
  const { error: uploadError } = await supabase.storage
    .from(ATTACHMENT_BUCKET)
    .upload(path, input.file, {
      cacheControl: '3600',
      upsert: false,
      contentType: input.file.type || 'application/octet-stream',
    });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('event_attachments')
    .insert({
      event_id: input.eventId,
      doc_type: input.docType,
      file_name: input.file.name,
      storage_path: path,
      content_type: input.file.type || null,
      size_bytes: input.file.size,
      uploaded_by: input.uploaderId,
    })
    .select('*')
    .single();

  if (error) {
    // Metadata insert failed; best-effort cleanup so we don't leak orphan blobs.
    await supabase.storage.from(ATTACHMENT_BUCKET).remove([path]);
    throw error;
  }
  return data as AttachmentRow;
}

export async function listAttachmentsForEvent(eventId: string): Promise<AttachmentRow[]> {
  const { data, error } = await supabase
    .from('event_attachments')
    .select('*')
    .eq('event_id', eventId)
    .order('uploaded_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as AttachmentRow[];
}
