import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card, CardTitle } from '../components/common/Card';
import { Button } from '../components/common/primitives';
import { useSession } from '../domain/session';
import { useStore } from '../domain/store';
import { theme } from '../styles/theme';

function ScorePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
}) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: theme.ink }}>{label}</div>
        <div style={{ fontSize: 11, color: theme.textTertiary, marginTop: 2 }}>
          0 = Would not recommend, 10 = Would definitely recommend
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(11, minmax(0, 1fr))', gap: 6 }}>
        {Array.from({ length: 11 }, (_, score) => {
          const active = value === score;
          return (
            <button
              key={score}
              type="button"
              onClick={() => onChange(score)}
              style={{
                height: 36,
                borderRadius: 7,
                border: `1px solid ${active ? theme.primary : theme.borderStrong}`,
                background: active ? theme.primary : theme.surface,
                color: active ? '#fff' : theme.textSecondary,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {score}
            </button>
          );
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', fontSize: 10, color: theme.textTertiary }}>
        <span>Not at all</span>
        <span style={{ textAlign: 'center' }}>Neutral</span>
        <span style={{ textAlign: 'right' }}>Recommend</span>
      </div>
    </div>
  );
}

export function FeedbackPage() {
  const { eventId = '' } = useParams();
  const navigate = useNavigate();
  const user = useSession((s) => s.user);
  const events = useStore((s) => s.events);
  const feedbackResponses = useStore((s) => s.feedbackResponses);
  const submitFeedbackResponse = useStore((s) => s.submitFeedbackResponse);

  const decodedEventId = decodeURIComponent(eventId);
  const event = events.find((e) => e.id === decodedEventId);
  const existing = feedbackResponses.find((response) => response.eventId === decodedEventId);
  const canSubmit = !!event && (
    event.requestor
      ? event.requestor.toLowerCase() === user?.email.toLowerCase()
      : !!event.feedbackRequested
  );

  const [toolScore, setToolScore] = useState<number | null>(existing?.toolScore ?? null);
  const [supportScore, setSupportScore] = useState<number | null>(existing?.supportScore ?? null);
  const [comment, setComment] = useState(existing?.comment ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setToolScore(existing.toolScore);
    setSupportScore(existing.supportScore);
    setComment(existing.comment ?? '');
  }, [existing]);

  const disabled = useMemo(
    () => busy || !canSubmit || toolScore == null || supportScore == null,
    [busy, canSubmit, toolScore, supportScore],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || toolScore == null || supportScore == null) return;

    setBusy(true);
    setError(null);
    const result = await submitFeedbackResponse({
      eventId: decodedEventId,
      toolScore,
      supportScore,
      comment,
    });
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
    window.setTimeout(() => navigate('/'), 700);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: theme.surfaceMuted,
      }}
    >
      <div style={{ width: '100%', maxWidth: 720 }}>
        <Card pad={0}>
          <div style={{ padding: '16px 20px', background: theme.ink, color: '#fff' }}>
            <div style={{ fontSize: 13, fontWeight: 800 }}>eSourcing CoE Feedback</div>
            <div style={{ marginTop: 3, fontSize: 11, color: 'rgba(255,255,255,.68)', fontFamily: theme.mono }}>
              {decodedEventId}
            </div>
          </div>

          <form onSubmit={submit} style={{ padding: 20, display: 'grid', gap: 20 }}>
            <div>
              <CardTitle>{event?.name ?? 'Feedback survey'}</CardTitle>
              <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 3 }}>
                Signed in as {user?.email}
              </div>
            </div>

            {!event && (
              <Banner kind="error">
                Event not found yet. Go back to the console once data has loaded, then reopen the feedback link.
              </Banner>
            )}
            {event && !canSubmit && (
              <Banner kind="error">
                {event.requestor
                  ? `This feedback link is assigned to ${event.requestor}.`
                  : 'Feedback has not been requested for this event yet.'}
              </Banner>
            )}
            {saved && <Banner kind="info">Feedback saved. Returning to the console...</Banner>}
            {error && <Banner kind="error">{error}</Banner>}

            <ScorePicker
              label="1. How would you rate the eSourcing tool for this event?"
              value={toolScore}
              onChange={setToolScore}
            />
            <ScorePicker
              label="2. How would you rate the CoE team support?"
              value={supportScore}
              onChange={setSupportScore}
            />

            <label style={{ display: 'grid', gap: 7 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: theme.textSecondary }}>
                Comment
              </span>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="Optional notes for the CoE team"
                style={{
                  resize: 'vertical',
                  border: `1px solid ${theme.borderStrong}`,
                  borderRadius: theme.radiusSm,
                  padding: '10px 12px',
                  color: theme.ink,
                  background: theme.surface,
                }}
              />
            </label>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <Link to="/" className="ui-btn ui-btn--ghost" style={{ textDecoration: 'none' }}>
                Back to console
              </Link>
              <Button type="submit" variant="primary" disabled={disabled}>
                {busy ? 'Saving...' : existing ? 'Update feedback' : 'Submit feedback'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

function Banner({ kind, children }: { kind: 'error' | 'info'; children: React.ReactNode }) {
  const isError = kind === 'error';
  return (
    <div
      style={{
        fontSize: 12.5,
        padding: '9px 12px',
        borderRadius: theme.radiusSm,
        background: isError ? theme.dangerBg : theme.infoBg,
        color: isError ? theme.danger : theme.info,
        border: `1px solid ${isError ? theme.danger : theme.info}`,
        lineHeight: 1.45,
      }}
    >
      {children}
    </div>
  );
}
