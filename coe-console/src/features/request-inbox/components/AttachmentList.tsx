import type { AttachmentRow } from '../../../domain/attachments';
import { theme } from '../../../styles/theme';

export function formatAttachmentBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb >= 10 ? 0 : 1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
}

export function AttachmentList({
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
    return <span style={{ fontSize: 11.5, color: theme.textTertiary }}>Checking attachments...</span>;
  }

  if (attachments.length === 0) {
    return (
      <span style={{ fontSize: 11.5, color: theme.textTertiary, whiteSpace: 'normal' }}>
        No attachments submitted.
      </span>
    );
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
              {attachment.doc_type} / {formatAttachmentBytes(Number(attachment.size_bytes))}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onDownload(attachment)}
            disabled={downloadingId === attachment.id}
            aria-label={`Download attachment ${attachment.file_name}`}
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
