// ---------------------------------------------------------------------------
// Shared domain constants — framework-agnostic, used by both Console & Form.
// ---------------------------------------------------------------------------

export type Region = 'NA' | 'EMEA' | 'APAC' | 'LATAM';
export const REGIONS: Region[] = ['NA', 'EMEA', 'APAC', 'LATAM'];

// Spend split weights per region.
export const REGION_W: Record<Region, number> = {
  NA: 0.34,
  EMEA: 0.33,
  APAC: 0.23,
  LATAM: 0.1,
};

export const REGION_LABEL: Record<Region, string> = {
  NA: 'North America',
  EMEA: 'EMEA',
  APAC: 'Asia Pacific',
  LATAM: 'Latin America',
};

// Amcor fiscal year = Jul–Jun.
export type FY = 'FY25' | 'FY26' | 'FY27';
export const FYS: FY[] = ['FY25', 'FY26', 'FY27'];

export const FY_GROWTH: Record<FY, number> = {
  FY25: 1.0,
  FY26: 1.06,
  FY27: 1.11,
};

// FY -> [startDate, endDate) where FY ends end of June of the YY year.
export const FY_RANGE: Record<FY, { start: string; end: string }> = {
  FY25: { start: '2024-07-01', end: '2025-06-30' },
  FY26: { start: '2025-07-01', end: '2026-06-30' },
  FY27: { start: '2026-07-01', end: '2027-06-30' },
};

export type EventType =
  | 'Forward Auction'
  | 'Reverse Auction'
  | 'RFQ'
  | 'RFP'
  | 'RFI';

export const EVENT_TYPES: EventType[] = [
  'Forward Auction',
  'Reverse Auction',
  'RFQ',
  'RFP',
  'RFI',
];

export const AUCTION_TYPES: EventType[] = ['Forward Auction', 'Reverse Auction'];

// Console statuses.
export type Status = 'Planned' | 'Live' | 'Completed';
export const STATUSES: Status[] = ['Planned', 'Live', 'Completed'];
export const OPERATIONAL_STATUSES: Status[] = STATUSES;

// Form-only statuses (used by the request form lifecycle).
export type FormStatus = 'Active' | 'On hold' | 'Cancelled';

export const STATUS_COLORS: Record<Status, { fg: string; bg: string }> = {
  Planned: { fg: '#94a3b8', bg: '#f1f5f9' },
  Live: { fg: '#f59e0b', bg: '#fef3e2' },
  Completed: { fg: '#10b981', bg: '#e7f8f0' },
};

// ---------------------------------------------------------------------------
// Console palette (single source of design tokens consumed by theme.ts).
// ---------------------------------------------------------------------------
export const PALETTE = {
  appBg: '#edf2fc',
  surface: '#ffffff',
  surfaceRaised: '#f7faff',
  surfaceMuted: '#eef3fb',
  border: '#d0d9ed',
  borderStrong: '#b8c6de',
  borderFocus: '#2563eb',
  radius: 10,
  radiusSm: 8,
  shadow: '0 1px 2px rgba(15,23,42,.04), 0 1px 3px rgba(15,23,42,.05)',
  shadowRaised: '0 4px 14px rgba(15,23,42,.07), 0 1px 3px rgba(15,23,42,.04)',
  shadowFocus: '0 0 0 3px rgba(37,99,235,.18)',

  primary: '#1e3a8a',
  primaryHover: '#1a3278',
  primaryMuted: 'rgba(30,58,138,.1)',
  primaryGradient: 'linear-gradient(135deg,#1e3a8a,#2563eb)',

  green: '#059669',
  green2: '#10b981',
  amber: '#d97706',
  ink: '#0f172a',

  textSecondary: '#475569',
  textTertiary: '#94a3b8',

  muted: '#64748b',
  muted2: '#94a3b8',
  muted3: '#9aa5b4',
  muted4: '#475569',
  muted5: '#334155',

  success: '#059669',
  successBg: '#ecfdf5',
  warning: '#d97706',
  warningBg: '#fffbeb',
  danger: '#dc2626',
  dangerBg: '#fef2f2',
  info: '#2563eb',
  infoBg: '#eff6ff',

  chart1: '#1e3a8a',
  chart2: '#2563eb',
  chart3: '#d97706',
  chart4: '#7c3aed',
  chart5: '#e11d48',
  chart6: '#0891b2',
  chart7: '#ca8a04',
  chart8: '#64748b',

  transitionFast: '120ms',
  transitionMedium: '200ms',
  easing: 'cubic-bezier(.4,0,.2,1)',
} as const;

export const CHART_COLORS = [
  PALETTE.chart1,
  PALETTE.chart2,
  PALETTE.chart3,
  PALETTE.chart4,
  PALETTE.chart5,
  PALETTE.chart6,
  PALETTE.chart7,
  PALETTE.chart8,
] as const;
