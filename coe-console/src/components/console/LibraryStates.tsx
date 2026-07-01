import { theme } from '../../styles/theme';
import { Card } from '../common/Card';

export function LibrarySkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="library-grid" aria-label="Loading resources">
      {Array.from({ length: count }, (_, index) => (
        <Card key={index} className="library-card" pad={16}>
          <div className="skeleton-line skeleton-line--short" />
          <div className="skeleton-line skeleton-line--title" />
          <div className="skeleton-line" />
          <div className="skeleton-line" />
          <div className="skeleton-line skeleton-line--medium" />
        </Card>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <Card pad={22} variant="muted">
      <div style={{ textAlign: 'center', maxWidth: 520, margin: '0 auto' }}>
        <div style={{ fontSize: 15, fontWeight: 850, color: theme.ink }}>{title}</div>
        <div style={{ marginTop: 5, fontSize: 12.5, color: theme.textSecondary, lineHeight: 1.45 }}>
          {detail}
        </div>
      </div>
    </Card>
  );
}

export function LoadError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Card pad={18}>
      <div
        role="alert"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 850, color: theme.danger }}>Unable to load content</div>
          <div style={{ marginTop: 4, fontSize: 12.5, color: theme.textSecondary }}>{message}</div>
        </div>
        <button type="button" className="ui-btn ui-btn--secondary" onClick={onRetry}>
          Retry
        </button>
      </div>
    </Card>
  );
}
