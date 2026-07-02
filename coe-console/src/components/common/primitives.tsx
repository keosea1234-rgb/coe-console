import type { CSSProperties, ReactNode } from 'react';
import { theme, card, numeric, sectionLabel } from '../../styles/theme';
import { STATUS_COLORS, type Status } from '../../domain/constants';

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'dark';

// --- Button ----------------------------------------------------------------
export function Button({
  children,
  variant = 'primary',
  type = 'button',
  disabled,
  onClick,
  className,
  style,
  form,
  ariaLabel,
}: {
  children: ReactNode;
  variant?: BtnVariant;
  type?: 'button' | 'submit';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
  form?: string;
  ariaLabel?: string;
}) {
  const cls = `ui-btn ui-btn--${variant}${className ? ` ${className}` : ''}`;
  return (
    <button
      type={type}
      form={form}
      disabled={disabled}
      onClick={onClick}
      className={cls}
      style={style}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

// --- KpiCard ---------------------------------------------------------------
export function KpiCard({
  label,
  value,
  sub,
  children,
  accent,
  helpText,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  children?: ReactNode;
  accent?: string;
  helpText?: string;
}) {
  return (
    <div
      style={{
        ...card,
        padding: '17px 19px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minHeight: 108,
      }}
    >
      <div style={{ ...sectionLabel, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>{label}</span>
        {helpText && (
          <span
            tabIndex={0}
            role="img"
            aria-label={`${label} definition: ${helpText}`}
            title={helpText}
            style={{
              display: 'inline-grid',
              placeItems: 'center',
              width: 17,
              height: 17,
              borderRadius: 999,
              border: `1px solid ${theme.borderStrong}`,
              background: theme.surfaceRaised,
              color: theme.textSecondary,
              fontSize: 11,
              fontWeight: 900,
              lineHeight: 1,
              cursor: 'help',
            }}
          >
            ?
          </span>
        )}
      </div>
      <div
        style={{
          fontSize: 25,
          fontWeight: 780,
          letterSpacing: 0,
          color: accent ?? theme.ink,
          lineHeight: 1.15,
          fontFamily: theme.display,
          ...numeric,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: theme.textSecondary, lineHeight: 1.4, ...numeric }}>{sub}</div>
      )}
      {children}
    </div>
  );
}

// --- SegmentedControl ------------------------------------------------------
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  fullWidth,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  fullWidth?: boolean;
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        width: fullWidth ? '100%' : undefined,
        background: theme.surfaceMuted,
        border: `1px solid ${theme.borderStrong}`,
        borderRadius: theme.radiusSm,
        padding: 3,
        gap: 2,
        boxShadow: 'inset 0 1px 1px rgba(15,23,42,.04)',
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            style={{
              flex: fullWidth ? 1 : undefined,
              border: 'none',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: 12.5,
              fontWeight: 680,
              background: active ? theme.surface : 'transparent',
              color: active ? theme.ink : theme.textSecondary,
              boxShadow: active ? '0 1px 2px rgba(15,23,42,.09), 0 5px 12px rgba(15,23,42,.06)' : 'none',
              transition: `all ${theme.transitionFast} ${theme.easing}`,
              cursor: 'pointer',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// --- Chip ------------------------------------------------------------------
export function Chip({
  label,
  active,
  onClick,
  color,
}: {
  label: ReactNode;
  active?: boolean;
  onClick?: () => void;
  color?: string;
}) {
  const c = color ?? theme.primary;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: `1px solid ${active ? c : theme.border}`,
        background: active ? `${c}14` : theme.surface,
        color: active ? c : theme.textSecondary,
        borderRadius: 999,
        padding: '5px 11px',
        fontSize: 12,
        fontWeight: 600,
        transition: `all ${theme.transitionFast} ${theme.easing}`,
        whiteSpace: 'nowrap',
        lineHeight: 1.2,
      }}
    >
      {label}
    </button>
  );
}

// --- ProgressBar -----------------------------------------------------------
export function ProgressBar({
  value,
  color,
  height = 7,
  track,
}: {
  value: number;
  color?: string;
  height?: number;
  track?: string;
}) {
  return (
    <div
      style={{
        background: track ?? theme.surfaceMuted,
        borderRadius: 999,
        height,
        overflow: 'hidden',
        width: '100%',
      }}
    >
      <div
        style={{
          width: `${Math.min(100, Math.max(0, value * 100))}%`,
          height: '100%',
          background: color ?? theme.primary,
          borderRadius: 999,
          transition: `width ${theme.transitionMedium} ${theme.easing}`,
        }}
      />
    </div>
  );
}

// --- StatusBadge -----------------------------------------------------------
export function StatusBadge({ status }: { status: Status }) {
  const c = STATUS_COLORS[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: c.bg,
        color: c.fg,
        fontSize: 11,
        fontWeight: 700,
        padding: '3px 8px',
        borderRadius: 999,
        fontFamily: theme.mono,
        lineHeight: 1.2,
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: 999, background: c.fg }} />
      {status}
    </span>
  );
}

// --- Toggle ----------------------------------------------------------------
export function Toggle({
  on,
  onChange,
  accent,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  accent?: string;
}) {
  const c = accent ?? theme.primary;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 999,
        border: 'none',
        background: on ? c : '#cbd5e1',
        position: 'relative',
        transition: `background ${theme.transitionFast} ${theme.easing}`,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: on ? 20 : 2,
          width: 18,
          height: 18,
          borderRadius: 999,
          background: '#fff',
          boxShadow: '0 1px 2px rgba(0,0,0,.15)',
          transition: `left ${theme.transitionFast} ${theme.easing}`,
        }}
      />
    </button>
  );
}

// --- Checkbox --------------------------------------------------------------
export function Checkbox({
  checked,
  onChange,
  label,
  accent,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
  accent?: string;
}) {
  const c = accent ?? theme.primary;
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        cursor: 'pointer',
        fontSize: 13,
        lineHeight: 1.4,
      }}
    >
      <span
        onClick={() => onChange(!checked)}
        style={{
          width: 17,
          height: 17,
          borderRadius: 5,
          border: `1.5px solid ${checked ? c : theme.borderStrong}`,
          background: checked ? c : theme.surface,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
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
      <span style={{ color: theme.muted5 }}>{label}</span>
    </label>
  );
}

// --- FilterSelect ----------------------------------------------------------
export function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  style,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <select
      className={`ui-select${className ? ` ${className}` : ''}`}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      style={{
        color: value ? theme.ink : theme.textTertiary,
        fontWeight: 600,
        fontSize: 12.5,
        height: 34,
        ...style,
      }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
