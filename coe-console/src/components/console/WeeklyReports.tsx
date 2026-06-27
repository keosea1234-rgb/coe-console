import { useState } from 'react';
import { theme } from '../../styles/theme';
import { SlideOver } from '../common/overlays';
import { Button, Checkbox, FilterSelect } from '../common/primitives';
import { IconReport } from './icons';
import type { Totals } from '../../domain/selectors';
import { fmtUSD, fmtPct, fmtNum } from '../../domain/selectors';

const SECTIONS = [
  'KPI summary',
  'Coverage by category',
  'Region performance',
  'Pipeline & status',
  'Savings trend',
  'Top untapped opportunities',
];

export function WeeklyReports({
  open,
  onClose,
  totals,
}: {
  open: boolean;
  onClose: () => void;
  totals: Totals;
}) {
  const [cadence, setCadence] = useState('Weekly');
  const [day, setDay] = useState('Monday');
  const [time, setTime] = useState('08:00');
  const [format, setFormat] = useState('PDF');
  const [recipients, setRecipients] = useState<string[]>(['cpo@amcor.com', 'category-leads@amcor.com']);
  const [draft, setDraft] = useState('');
  const [sections, setSections] = useState<Record<string, boolean>>(
    Object.fromEntries(SECTIONS.map((s) => [s, true])),
  );

  const addRecipient = () => {
    const v = draft.trim();
    if (v && !recipients.includes(v)) setRecipients([...recipients, v]);
    setDraft('');
  };

  const footer = (
    <div
      style={{
        borderTop: `1px solid ${theme.border}`,
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: theme.surfaceRaised,
        flexShrink: 0,
        gap: 10,
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontSize: 11, color: theme.textSecondary, fontFamily: theme.mono }}>
        Next run: {day} {time}
      </span>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="secondary">Generate now</Button>
        <Button variant="dark">Save schedule</Button>
      </div>
    </div>
  );

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      width={440}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: theme.ink,
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
            }}
          >
            <IconReport size={14} />
          </span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: theme.ink }}>Weekly reports</div>
            <div style={{ fontSize: 11, color: theme.textSecondary }}>Scheduled coverage digest</div>
          </div>
        </div>
      }
      footer={footer}
    >
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Section title="Schedule">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Cadence">
              <FilterSelect
                value={cadence}
                onChange={setCadence}
                style={{ width: '100%' }}
                options={['Daily', 'Weekly', 'Bi-weekly', 'Monthly'].map((v) => ({ value: v, label: v }))}
              />
            </Field>
            <Field label="Day">
              <FilterSelect
                value={day}
                onChange={setDay}
                style={{ width: '100%' }}
                options={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((v) => ({
                  value: v,
                  label: v,
                }))}
              />
            </Field>
            <Field label="Time">
              <FilterSelect
                value={time}
                onChange={setTime}
                style={{ width: '100%' }}
                options={['06:00', '07:00', '08:00', '09:00', '12:00', '17:00'].map((v) => ({
                  value: v,
                  label: v,
                }))}
              />
            </Field>
            <Field label="Format">
              <FilterSelect
                value={format}
                onChange={setFormat}
                style={{ width: '100%' }}
                options={['PDF', 'Email body', 'Teams card', 'Excel'].map((v) => ({ value: v, label: v }))}
              />
            </Field>
          </div>
        </Section>

        <Section title="Recipients">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {recipients.map((r) => (
              <span
                key={r}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: theme.surfaceMuted,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 999,
                  padding: '4px 8px 4px 11px',
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: theme.mono,
                }}
              >
                {r}
                <button
                  type="button"
                  onClick={() => setRecipients(recipients.filter((x) => x !== r))}
                  aria-label={`Remove ${r}`}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: theme.textTertiary,
                    fontSize: 14,
                    lineHeight: 1,
                    padding: 0,
                  }}
                >
                  x
                </button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addRecipient()}
              placeholder="name@company.com"
              className="ui-input"
              style={{ flex: 1 }}
            />
            <Button variant="primary" onClick={addRecipient}>
              Add
            </Button>
          </div>
        </Section>

        <Section title="Sections to include">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SECTIONS.map((s) => (
              <Checkbox
                key={s}
                label={s}
                checked={sections[s]}
                onChange={(v) => setSections({ ...sections, [s]: v })}
              />
            ))}
          </div>
        </Section>

        <div
          style={{
            background: theme.surfaceMuted,
            border: `1px solid ${theme.border}`,
            borderRadius: theme.radius,
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontFamily: theme.mono,
              letterSpacing: '.07em',
              textTransform: 'uppercase',
              color: theme.textTertiary,
              marginBottom: 12,
            }}
          >
            This week&apos;s snapshot
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Snap label="Events" value={fmtNum(totals.events)} />
            <Snap label="Sourced" value={fmtUSD(totals.sourced)} />
            <Snap label="Coverage" value={fmtPct(totals.coverage)} />
            <Snap label="Savings" value={fmtUSD(totals.savings)} />
          </div>
          <div style={{ fontSize: 11, color: theme.textTertiary, marginTop: 12 }}>
            Reflects the console&apos;s current filters.
          </div>
        </div>
      </div>
    </SlideOver>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '.07em',
          textTransform: 'uppercase',
          color: theme.textTertiary,
          fontFamily: theme.mono,
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: 11, color: theme.textSecondary, fontWeight: 600 }}>{label}</span>
      {children}
    </label>
  );
}

function Snap({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          color: theme.textTertiary,
          textTransform: 'uppercase',
          letterSpacing: '.06em',
          fontFamily: theme.mono,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 17,
          fontWeight: 800,
          fontFamily: theme.mono,
          fontVariantNumeric: 'tabular-nums',
          color: theme.ink,
        }}
      >
        {value}
      </div>
    </div>
  );
}
