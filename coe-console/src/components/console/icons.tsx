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

export const IconDownload = ({ size = 16, color = '#fff', style }: IconProps) =>
  base(
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </>,
    size,
    color,
    style,
  );

export const IconExternal = ({ size = 16, color = '#475569', style }: IconProps) =>
  base(
    <>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </>,
    size,
    color,
    style,
  );

export const IconFileText = ({ size = 16, color = '#475569', style }: IconProps) =>
  base(
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
      <line x1="8" y1="9" x2="10" y2="9" />
    </>,
    size,
    color,
    style,
  );

export const IconSpreadsheet = ({ size = 16, color = '#475569', style }: IconProps) =>
  base(
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="9" y1="4" x2="9" y2="20" />
      <line x1="15" y1="4" x2="15" y2="20" />
      <line x1="3" y1="15" x2="21" y2="15" />
    </>,
    size,
    color,
    style,
  );

export const IconVideo = ({ size = 16, color = '#475569', style }: IconProps) =>
  base(
    <>
      <rect x="3" y="5" width="14" height="14" rx="2" />
      <path d="m17 9 4-2v10l-4-2" />
    </>,
    size,
    color,
    style,
  );

export const IconBookOpen = ({ size = 16, color = '#475569', style }: IconProps) =>
  base(
    <>
      <path d="M2 4h7a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H2z" />
      <path d="M22 4h-7a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h7z" />
    </>,
    size,
    color,
    style,
  );

export const IconHelpCircle = ({ size = 16, color = '#475569', style }: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.1 9a3 3 0 1 1 5.8 1c-.5 1.2-1.9 1.7-2.5 2.7" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </>,
    size,
    color,
    style,
  );

export const IconClock = ({ size = 16, color = '#475569', style }: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </>,
    size,
    color,
    style,
  );
