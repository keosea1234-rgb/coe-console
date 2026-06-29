import type { CSSProperties, ReactNode } from 'react';
import { theme, numeric, sectionLabel } from '../../styles/theme';

export function FormField({
  label,
  required,
  error,
  hint,
  children,
  style,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: theme.muted5, lineHeight: 1.3 }}>
        {label}
        {required && (
          <span style={{ color: theme.warning, marginLeft: 3 }} aria-hidden>
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <span
          style={{
            fontSize: 12,
            color: theme.danger,
            fontWeight: 500,
            lineHeight: 1.35,
            animation: 'fadeUp .2s ease both',
          }}
          role="alert"
        >
          {error}
        </span>
      )}
      {!error && hint && (
        <span style={{ fontSize: 11.5, color: theme.textTertiary, lineHeight: 1.4 }}>{hint}</span>
      )}
    </div>
  );
}

export function TextInput({
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
  readOnly,
  list,
  id,
}: {
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  error?: boolean;
  readOnly?: boolean;
  list?: string;
  id?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      readOnly={readOnly}
      list={list}
      placeholder={placeholder}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      className={`ui-input${error ? ' ui-input--error' : ''}${readOnly ? ' ui-input--readonly' : ''}`}
    />
  );
}

export function NumberInput({
  value,
  onChange,
  placeholder,
  error,
  min,
  step,
}: {
  value: number | '';
  onChange: (v: number) => void;
  placeholder?: string;
  error?: boolean;
  min?: number;
  step?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      step={step}
      placeholder={placeholder}
      onChange={(e) => {
        const n = parseFloat(e.target.value);
        onChange(Number.isNaN(n) ? 0 : n);
      }}
      className={`ui-input${error ? ' ui-input--error' : ''}`}
      style={numeric}
    />
  );
}

export function FormSection({
  title,
  description,
  children,
  complete,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  complete?: boolean;
}) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {complete !== undefined && (
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: 999,
              flexShrink: 0,
              marginTop: 1,
              display: 'grid',
              placeItems: 'center',
              fontSize: 11,
              fontWeight: 700,
              background: complete ? theme.successBg : theme.surfaceMuted,
              color: complete ? theme.success : theme.textTertiary,
              border: `1.5px solid ${complete ? theme.success : theme.border}`,
              transition: `all ${theme.transitionFast} ${theme.easing}`,
            }}
            aria-hidden
          >
            {complete ? '✓' : ''}
          </span>
        )}
        <div style={{ flex: 1 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 14.5,
              fontWeight: 700,
              letterSpacing: 0,
              color: theme.ink,
              lineHeight: 1.35,
            }}
          >
            {title}
          </h2>
          {description && (
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: theme.textSecondary, lineHeight: 1.45 }}>
              {description}
            </p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

export function FieldGrid({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
      }}
    >
      {children}
    </div>
  );
}

export function AssessmentFlag({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
        textAlign: 'left',
        width: '100%',
        padding: '14px 16px',
        border: `1px solid ${checked ? theme.primary : theme.border}`,
        borderRadius: theme.radius,
        background: checked ? theme.primaryMuted : theme.surface,
        cursor: 'pointer',
        transition: `all ${theme.transitionFast} ${theme.easing}`,
        boxShadow: checked ? theme.shadow : 'none',
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 5,
          flexShrink: 0,
          marginTop: 2,
          border: `1.5px solid ${checked ? theme.primary : theme.borderStrong}`,
          background: checked ? theme.primary : theme.surface,
          display: 'grid',
          placeItems: 'center',
          transition: `all ${theme.transitionFast} ${theme.easing}`,
        }}
      >
        {checked && (
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
      <span>
        <span
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 600,
            color: theme.ink,
            lineHeight: 1.4,
          }}
        >
          {label}
        </span>
        <span
          style={{
            display: 'block',
            marginTop: 4,
            fontSize: 12,
            color: theme.textSecondary,
            lineHeight: 1.5,
          }}
        >
          {description}
        </span>
      </span>
    </button>
  );
}

export function DropZone({
  onFiles,
  children,
}: {
  onFiles: (files: FileList) => void;
  children?: ReactNode;
}) {
  return (
    <label
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '20px 16px',
        border: `1.5px dashed ${theme.borderStrong}`,
        borderRadius: theme.radius,
        background: theme.surfaceMuted,
        cursor: 'pointer',
        transition: `border-color ${theme.transitionFast} ${theme.easing}, background ${theme.transitionFast} ${theme.easing}`,
        textAlign: 'center',
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.style.borderColor = theme.primary;
        e.currentTarget.style.background = theme.primaryMuted;
      }}
      onDragLeave={(e) => {
        e.currentTarget.style.borderColor = theme.borderStrong;
        e.currentTarget.style.background = theme.surfaceMuted;
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.style.borderColor = theme.borderStrong;
        e.currentTarget.style.background = theme.surfaceMuted;
        if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
      }}
    >
      <input
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = '';
        }}
      />
      {children ?? (
        <>
          <span style={{ fontSize: 13, fontWeight: 600, color: theme.ink }}>
            Drop files here or click to browse
          </span>
          <span style={{ fontSize: 12, color: theme.textTertiary }}>
            Bid template, RFI questionnaire, supplier list
          </span>
        </>
      )}
    </label>
  );
}

export function SummaryRow({ label, value, accent }: { label: string; value: ReactNode; accent?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 12,
        padding: '7px 0',
        borderBottom: `1px solid ${theme.border}`,
      }}
    >
      <span style={{ ...sectionLabel, fontSize: 10, letterSpacing: '.06em' }}>{label}</span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: accent ?? theme.ink,
          textAlign: 'right',
          ...numeric,
        }}
      >
        {value}
      </span>
    </div>
  );
}
