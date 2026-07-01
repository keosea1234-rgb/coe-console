import { Card } from '../../../components/common/Card';
import { SummaryRow } from '../../../components/form/FormPrimitives';
import type { EventType, FY, Status } from '../../../domain/constants';
import { fmtUSD } from '../../../domain/selectors';
import { sectionLabel, theme } from '../../../styles/theme';

interface RequestReviewPanelProps {
  totalSpend: number;
  eventId: string;
  resolvedFy: FY;
  status: Status;
  eventTypes: EventType[];
  category: string;
  subcategory: string;
  groupsWithSpend: number;
  dashboardImpact: Array<{ label: string; value: string }>;
  assessmentFlags: string[];
  attachmentsCount: number;
}

export function RequestReviewPanel({
  totalSpend,
  eventId,
  resolvedFy,
  status,
  eventTypes,
  category,
  subcategory,
  groupsWithSpend,
  dashboardImpact,
  assessmentFlags,
  attachmentsCount,
}: RequestReviewPanelProps) {
  return (
    <aside
      className="form-summary-panel"
      style={{
        position: 'sticky',
        top: theme.headerH + 16,
      }}
    >
      <Card variant="raised" style={{ padding: 16 }}>
        <div style={{ ...sectionLabel, marginBottom: 12 }}>Event summary</div>
        <div className="summary-primary">
          <span>Estimated addressable spend</span>
          <strong>{fmtUSD(totalSpend)}</strong>
        </div>
        <SummaryRow label="Event ID" value={eventId || '-'} />
        <SummaryRow label="Fiscal year" value={resolvedFy} />
        <SummaryRow label="Status" value={status} />
        <SummaryRow label="Event types" value={eventTypes.length ? eventTypes.join(' + ') : 'Not selected'} />
        <SummaryRow label="Total spend" value={fmtUSD(totalSpend)} accent={theme.primary} />
        <SummaryRow label="Category" value={category || 'Not selected'} />
        <SummaryRow label="Subcategory" value={subcategory || 'Not selected'} />
        <SummaryRow
          label="Business groups"
          value={groupsWithSpend > 0 ? `${groupsWithSpend} with spend` : 'None'}
        />
        <div style={{ paddingTop: 10 }}>
          <div style={{ ...sectionLabel, marginBottom: 8 }}>Dashboard routing</div>
          <div style={{ display: 'grid', gap: 7 }}>
            {dashboardImpact.map((item) => (
              <div key={item.label} className="route-row">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
        <div style={{ paddingTop: 8 }}>
          <div style={{ ...sectionLabel, marginBottom: 8 }}>Assessments</div>
          {assessmentFlags.length === 0 ? (
            <span style={{ fontSize: 12, color: theme.textTertiary }}>None selected</span>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {assessmentFlags.map((flag) => (
                <span
                  key={flag}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: 999,
                    background: theme.primaryMuted,
                    color: theme.primary,
                  }}
                >
                  {flag}
                </span>
              ))}
            </div>
          )}
        </div>
        {attachmentsCount > 0 && (
          <div style={{ paddingTop: 10, borderTop: `1px solid ${theme.border}`, marginTop: 10 }}>
            <div style={{ ...sectionLabel, marginBottom: 6 }}>Attachments</div>
            <span style={{ fontSize: 12, color: theme.textSecondary }}>
              {attachmentsCount} file{attachmentsCount !== 1 ? 's' : ''} attached
            </span>
          </div>
        )}
      </Card>
    </aside>
  );
}
