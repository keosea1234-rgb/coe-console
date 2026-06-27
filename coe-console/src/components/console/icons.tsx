import type { CSSProperties } from 'react';

const base = (path: JSX.Element, size: number, color: string, style?: CSSProperties) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    {path}
  </svg>
);

type IconProps = { size?: number; color?: string; style?: CSSProperties };

export const IconReport = ({ size = 16, color = '#fff', style }: IconProps) =>
  base(
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </>,
    size,
    color,
    style,
  );

export const IconClose = ({ size = 14, color = '#667085', style }: IconProps) =>
  base(
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>,
    size,
    color,
    style,
  );

export const IconMail = ({ size = 15, color = '#94a09a', style }: IconProps) =>
  base(
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 5L2 7" />
    </>,
    size,
    color,
    style,
  );

export const IconArrowUp = ({ size = 14, color = '#0f9d6e', style }: IconProps) =>
  base(
    <>
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </>,
    size,
    color,
    style,
  );

export const IconTarget = ({ size = 16, color = '#fff', style }: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </>,
    size,
    color,
    style,
  );

export const IconTrend = ({ size = 16, color = '#fff', style }: IconProps) =>
  base(
    <>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </>,
    size,
    color,
    style,
  );

export const IconLayers = ({ size = 16, color = '#fff', style }: IconProps) =>
  base(
    <>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </>,
    size,
    color,
    style,
  );
