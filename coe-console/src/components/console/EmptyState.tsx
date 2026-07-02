import { theme } from '../../styles/theme';

export function EmptyState({
  title,
  detail,
  compact = false,
}: {
  title: string;
  detail: string;
  compact?: boolean;
}) {
  return (
    <div
      role="status"
      style={{
        margin: compact ? 0 : '4px 0',
        padding: compact ? '18px 14px' : '30px 18px',
        border: `1px dashed ${theme.borderStrong}`,
        borderRadius: theme.radiusSm,
        background: theme.surfaceRaised,
        color: theme.textSecondary,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 800, color: theme.ink }}>{title}</div>
      <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.45 }}>{detail}</div>
    </div>
  );
}
