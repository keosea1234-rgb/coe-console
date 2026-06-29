import { PALETTE } from '../domain/constants';

const sans =
  `'Inter', 'SF Pro Text', 'Segoe UI Variable Text', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;
const display =
  `'Inter Tight', 'SF Pro Display', 'Segoe UI Variable Display', 'Inter', 'Segoe UI', Roboto, sans-serif`;
const number =
  `'Inter', 'SF Pro Text', 'Segoe UI Variable Text', 'Aptos', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;

// Central theme object: every component derives colors/spacing from here.
export const theme = {
  ...PALETTE,
  font: sans,
  display,
  number,
  mono: number,
  headerH: 56,
  filterH: 48,
} as const;

export const card: React.CSSProperties = {
  background: theme.surface,
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radius,
  boxShadow: theme.shadow,
  outline: '1px solid rgba(255,255,255,.75)',
  outlineOffset: '-2px',
};

export const cardInteractive: React.CSSProperties = {
  ...card,
  transition: `box-shadow ${theme.transitionMedium} ${theme.easing}, border-color ${theme.transitionFast} ${theme.easing}`,
};

export const sectionLabel: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 760,
  letterSpacing: 0,
  textTransform: 'uppercase',
  color: theme.muted4,
  fontFamily: theme.font,
  lineHeight: 1.3,
};

export const numeric: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: '"tnum" 1, "cv02" 1, "cv03" 1, "cv04" 1, "zero" 1',
  fontFamily: theme.number,
};

export const chartGrid = theme.border;
