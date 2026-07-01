import { Card } from '../../../components/common/Card';
import { FilterSelect } from '../../../components/common/primitives';
import { DropZone, FieldGrid, FormField, FormSection } from '../../../components/form/FormPrimitives';
import {
  ALLOWED_ATTACHMENT_EXTENSIONS,
  MAX_ATTACHMENT_SIZE_BYTES,
} from '../../../domain/attachments';
import type { RequestValidationErrors } from '../../../domain/requestIntake';
import { theme } from '../../../styles/theme';
import {
  DOC_TYPES,
  type AttachmentRow,
  type DocType,
  type UploadFailure,
  type UploadProgress,
  type UploadStatus,
} from '../model/requestIntake.types';

interface AttachmentsSectionProps {
  docType: DocType;
  attachments: AttachmentRow[];
  uploadStatus: UploadStatus;
  uploadProgress: UploadProgress | null;
  uploadFailures: UploadFailure[];
  errors: RequestValidationErrors;
  onDocTypeChange: (value: DocType) => void;
  onFiles: (files: FileList) => void;
  onRemoveAttachment: (key: string) => void;
}

export function AttachmentsSection({
  docType,
  attachments,
  uploadStatus,
  uploadProgress,
  uploadFailures,
  errors,
  onDocTypeChange,
  onFiles,
  onRemoveAttachment,
}: AttachmentsSectionProps) {
  return (
    <Card>
      <FormSection title="Attachments" description="bid template, RFI questionnaire">
        <FieldGrid>
          <FormField
            label="Document type"
            hint={`Allowed: ${ALLOWED_ATTACHMENT_EXTENSIONS.join(', ')} (max ${Math.round(
              MAX_ATTACHMENT_SIZE_BYTES / 1024 / 1024,
            )} MB)`}
          >
            <FilterSelect
              value={docType}
              onChange={(value) => onDocTypeChange(value as DocType)}
              options={DOC_TYPES.map((item) => ({ value: item, label: item }))}
              style={{ width: '100%' }}
            />
          </FormField>
        </FieldGrid>

        <DropZone onFiles={onFiles} />

        {errors.attachments && (
          <span style={{ fontSize: 12, color: theme.danger, fontWeight: 500 }} role="alert">
            {errors.attachments}
          </span>
        )}

        {uploadStatus === 'uploading' && uploadProgress && (
          <div
            role="status"
            style={{
              padding: '8px 12px',
              borderRadius: theme.radiusSm,
              background: theme.primaryMuted,
              color: theme.primary,
              fontSize: 12.5,
            }}
          >
            Uploading attachments... {uploadProgress.done}/{uploadProgress.total}
          </div>
        )}

        {uploadStatus === 'partial-failure' && uploadFailures.length > 0 && (
          <div
            role="alert"
            style={{
              padding: '10px 14px',
              borderRadius: theme.radiusSm,
              background: `${theme.danger}14`,
              border: `1px solid ${theme.danger}40`,
              color: theme.danger,
              fontSize: 12.5,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              Event saved, but {uploadFailures.length} file
              {uploadFailures.length === 1 ? '' : 's'} did not upload:
            </div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {uploadFailures.map((failure) => (
                <li key={failure.name}>
                  {failure.name}: {failure.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {attachments.length > 0 && (
          <ul
            style={{
              margin: '12px 0 0',
              padding: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            {attachments.map((attachment) => (
              <li
                key={attachment.key}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  padding: '8px 12px',
                  background: attachment.error ? `${theme.danger}10` : theme.surfaceMuted,
                  borderRadius: theme.radiusSm,
                  border: `1px solid ${attachment.error ? `${theme.danger}50` : theme.border}`,
                  fontSize: 12.5,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      fontFamily: theme.mono,
                      color: theme.primary,
                      background: theme.primaryMuted,
                      padding: '2px 7px',
                      borderRadius: 4,
                    }}
                  >
                    {attachment.docType}
                  </span>
                  <span style={{ color: theme.ink, fontWeight: 500, flex: 1, minWidth: 0 }}>
                    {attachment.file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveAttachment(attachment.key)}
                    className="ui-btn ui-btn--ghost"
                    style={{ height: 26, padding: '4px 8px', fontSize: 11 }}
                  >
                    Remove
                  </button>
                </div>
                {attachment.error && (
                  <span role="alert" style={{ fontSize: 11.5, color: theme.danger, fontWeight: 600 }}>
                    {attachment.error}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </FormSection>
    </Card>
  );
}
