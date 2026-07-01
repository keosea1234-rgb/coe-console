import { CATEGORY_BY_NAME } from '../../domain/categories';
import type { CategoryTemplate } from '../../domain/templateTypes';
import { theme } from '../../styles/theme';
import { Card } from '../common/Card';
import { IconDownload, IconFileText, IconSpreadsheet } from './icons';

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatFileSize(kb: number | undefined): string {
  if (!kb) return 'Size pending';
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
}

function formatLabel(value: string): string {
  return value.toUpperCase();
}

function FileFormatIcon({ format }: { format: CategoryTemplate['fileFormat'] }) {
  if (format === 'xlsx') return <IconSpreadsheet size={16} color={theme.green} />;
  return <IconFileText size={16} color={format === 'pdf' ? theme.danger : theme.primary} />;
}

export function TemplateCard({ template }: { template: CategoryTemplate }) {
  const category = CATEGORY_BY_NAME[template.category];
  const categoryColor = category?.color ?? theme.primary;

  return (
    <Card className="library-card" pad={16}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                maxWidth: '100%',
                padding: '3px 8px',
                borderRadius: 6,
                border: `1px solid ${categoryColor}55`,
                background: `${categoryColor}14`,
                color: categoryColor,
                fontSize: 11,
                fontWeight: 800,
                lineHeight: 1.2,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: 2, background: categoryColor, flexShrink: 0 }} />
              {template.category}
            </span>
            <span
              style={{
                padding: '3px 8px',
                borderRadius: 6,
                background: template.documentType === 'RFI' ? theme.infoBg : theme.warningBg,
                color: template.documentType === 'RFI' ? theme.info : theme.warning,
                fontSize: 11,
                fontWeight: 800,
                fontFamily: theme.mono,
                lineHeight: 1.2,
              }}
            >
              {template.documentType}
            </span>
          </div>

          <h3
            style={{
              margin: 0,
              fontSize: 16,
              lineHeight: 1.25,
              color: theme.ink,
              fontWeight: 850,
              letterSpacing: 0,
            }}
          >
            {template.title}
          </h3>
        </div>

        <span
          aria-label={`${formatLabel(template.fileFormat)} file`}
          style={{
            width: 34,
            height: 34,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 8,
            border: `1px solid ${theme.border}`,
            background: theme.surfaceRaised,
            flexShrink: 0,
          }}
        >
          <FileFormatIcon format={template.fileFormat} />
        </span>
      </div>

      <p style={{ margin: '12px 0 0', color: theme.textSecondary, fontSize: 12.5, lineHeight: 1.5 }}>
        {template.description}
      </p>

      <dl className="library-meta-grid" style={{ margin: '14px 0 0' }}>
        <Meta label="Version" value={template.version} />
        <Meta label="Updated" value={formatDate(template.lastUpdated)} />
        <Meta label="Owner" value={template.owner} />
        <Meta label="File" value={`${formatLabel(template.fileFormat)} / ${formatFileSize(template.fileSizeKb)}`} />
      </dl>

      <div
        style={{
          marginTop: 15,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            minWidth: 0,
            color: theme.textTertiary,
            fontSize: 11,
            fontFamily: theme.mono,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={template.fileName}
        >
          {template.fileName}
        </span>
        <a
          href={template.downloadUrl}
          download={template.fileName}
          className="ui-btn ui-btn--primary"
          aria-label={`Download ${template.title}`}
          style={{ textDecoration: 'none', height: 34, padding: '7px 12px', fontSize: 12.5 }}
        >
          <IconDownload size={14} />
          Download
        </a>
      </div>
    </Card>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt
        style={{
          color: theme.textTertiary,
          fontSize: 10,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: 0,
        }}
      >
        {label}
      </dt>
      <dd style={{ margin: '3px 0 0', color: theme.ink, fontSize: 11.5, fontWeight: 700, lineHeight: 1.3 }}>
        {value}
      </dd>
    </div>
  );
}
