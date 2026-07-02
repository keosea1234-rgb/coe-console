import { useMemo, useState, type CSSProperties } from 'react';
import type { SessionUser } from '../../domain/session';
import type { RequestUpdate, SourcingEvent } from '../../domain/types';
import { theme } from '../../styles/theme';
import { Button } from '../common/primitives';

function fmtUpdateAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function initials(email: string): string {
  const cleaned = email.trim();
  if (!cleaned) return '--';
  const local = cleaned.split('@')[0] ?? cleaned;
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

function authorLabel(update: RequestUpdate, currentUser: Pick<SessionUser, 'id'> | null) {
  if (update.authorId === currentUser?.id) return 'You';
  return update.authorRole === 'admin' ? 'CoE' : 'Requestor';
}

export function RequestConversation({
  event,
  updates,
  currentUser,
  onPost,
  style,
}: {
  event: SourcingEvent;
  updates: RequestUpdate[];
  currentUser: Pick<SessionUser, 'id' | 'email' | 'role'> | null;
  onPost: (eventId: string, body: string) => Promise<{ error: string | null }>;
  style?: CSSProperties;
}) {
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ordered = useMemo(
    () => [...updates].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [updates],
  );

  const submit = async () => {
    const body = draft.trim();
    if (!body) {
      setError('Write an update before posting.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await onPost(event.id, body);
      if (result.error) {
        setError(result.error);
        return;
      }
      setDraft('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      style={{
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${theme.borderStrong}`,
        borderRadius: theme.radius,
        background: theme.surface,
        overflow: 'hidden',
        boxShadow: theme.shadow,
        ...style,
      }}
    >
      <div
        style={{
          padding: '15px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          borderBottom: `1px solid ${theme.border}`,
          background: theme.surfaceRaised,
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 850, color: theme.ink, lineHeight: 1.2 }}>
            Request updates
          </div>
          <div style={{ marginTop: 3, fontSize: 11.5, color: theme.textTertiary, fontFamily: theme.mono }}>
            {event.id} / {ordered.length} update{ordered.length === 1 ? '' : 's'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span
            title="Requestor"
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 28,
              height: 28,
              borderRadius: 999,
              background: theme.infoBg,
              color: theme.info,
              fontSize: 10.5,
              fontWeight: 850,
              fontFamily: theme.mono,
              border: `1px solid ${theme.border}`,
            }}
          >
            RQ
          </span>
          <span
            title="CoE"
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 28,
              height: 28,
              borderRadius: 999,
              background: theme.primary,
              color: '#fff',
              fontSize: 10.5,
              fontWeight: 850,
              fontFamily: theme.mono,
              boxShadow: '0 1px 2px rgba(30, 58, 138, 0.25)',
            }}
          >
            CO
          </span>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 260,
          overflowY: 'auto',
          padding: 16,
          display: 'grid',
          alignContent: 'start',
          gap: 12,
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
        }}
      >
        {ordered.length === 0 ? (
          <div
            style={{
              minHeight: 180,
              display: 'grid',
              placeItems: 'center',
              border: `1px dashed ${theme.borderStrong}`,
              borderRadius: theme.radiusSm,
              color: theme.textTertiary,
              fontSize: 12,
              fontWeight: 700,
              fontFamily: theme.mono,
              background: 'rgba(255,255,255,0.72)',
            }}
          >
            No CoE/requestor updates yet.
          </div>
        ) : (
          ordered.map((update) => {
            const mine = update.authorId === currentUser?.id;
            return (
              <div
                key={update.id}
                style={{
                  display: 'flex',
                  justifyContent: mine ? 'flex-end' : 'flex-start',
                  gap: 9,
                }}
              >
                {!mine && (
                  <span
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      width: 30,
                      height: 30,
                      borderRadius: 999,
                      background: update.authorRole === 'admin' ? theme.primary : theme.infoBg,
                      color: update.authorRole === 'admin' ? '#fff' : theme.info,
                      fontSize: 10,
                      fontWeight: 850,
                      fontFamily: theme.mono,
                      flexShrink: 0,
                    }}
                  >
                    {initials(update.authorEmail)}
                  </span>
                )}
                <div
                  style={{
                    maxWidth: 'min(620px, 82%)',
                    display: 'grid',
                    gap: 4,
                    justifyItems: mine ? 'end' : 'start',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      flexWrap: 'wrap',
                      justifyContent: mine ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: theme.ink }}>
                      {authorLabel(update, currentUser)}
                    </span>
                    <span style={{ fontSize: 10.5, color: theme.textTertiary, fontFamily: theme.mono }}>
                      {fmtUpdateAt(update.createdAt)}
                    </span>
                  </div>
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: mine ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                      background: mine ? theme.primary : theme.surface,
                      color: mine ? '#fff' : theme.ink,
                      border: mine ? 'none' : `1px solid ${theme.border}`,
                      boxShadow: mine ? '0 4px 10px rgba(30, 58, 138, 0.2)' : theme.shadow,
                      fontSize: 12.5,
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {update.body}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div
        style={{
          padding: 14,
          display: 'grid',
          gap: 9,
          borderTop: `1px solid ${theme.border}`,
          background: theme.surfaceRaised,
        }}
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={2000}
          rows={4}
          aria-label={`Write an update for ${event.name}`}
          placeholder="Write an update..."
          disabled={!currentUser || submitting}
          style={{
            width: '100%',
            resize: 'vertical',
            minHeight: 86,
            borderRadius: theme.radiusSm,
            border: `1px solid ${theme.borderStrong}`,
            background: theme.surface,
            color: theme.ink,
            padding: '10px 12px',
            fontSize: 12.5,
            lineHeight: 1.5,
            fontFamily: 'inherit',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
          <span
            role={error ? 'alert' : undefined}
            style={{
              minHeight: 18,
              fontSize: 11,
              color: error ? theme.danger : theme.textTertiary,
              fontFamily: theme.mono,
            }}
          >
            {error ?? `${draft.length}/2000`}
          </span>
          <Button
            variant="primary"
            disabled={!currentUser || submitting || draft.trim().length === 0}
            onClick={() => void submit()}
            style={{ minWidth: 108 }}
          >
            {submitting ? 'Posting...' : 'Post update'}
          </Button>
        </div>
      </div>
    </section>
  );
}
