import type { CSSProperties, ReactNode } from 'react';
import { theme, card, cardInteractive } from '../../styles/theme';

interface Props {
  children: ReactNode;
  style?: CSSProperties;
  pad?: number;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'raised' | 'muted';
}

export function Card({ children, style, pad = 18, className, onClick, variant = 'default' }: Props) {
  const base = onClick ? cardInteractive : card;
  const bg =
    variant === 'raised'
      ? theme.surfaceRaised
      : variant === 'muted'
        ? theme.surfaceMuted
        : theme.surface;

  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        ...base,
        background: bg,
        padding: pad,
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
      onMouseEnter={
        onClick
          ? (e) => {
              e.currentTarget.style.boxShadow = theme.shadowRaised;
              e.currentTarget.style.borderColor = theme.borderStrong;
            }
          : undefined
      }
      onMouseLeave={
        onClick
          ? (e) => {
              e.currentTarget.style.boxShadow = theme.shadow;
              e.currentTarget.style.borderColor = theme.border;
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  style,
  sub,
}: {
  children: ReactNode;
  style?: CSSProperties;
  sub?: ReactNode;
}) {
  return (
    <div style={{ marginBottom: sub ? 6 : 0 }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          fontSize: 14.5,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          color: theme.primary,
          border: `1.5px solid rgba(37,99,235,0.38)`,
          borderRadius: 7,
          padding: '4px 11px',
          background: 'rgba(37,99,235,0.055)',
          lineHeight: 1.35,
          ...style,
        }}
      >
        {children}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 5, lineHeight: 1.45 }}>
          {sub}
        </div>
      )}
    </div>
  );
}
