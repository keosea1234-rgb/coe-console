import { PALETTE } from '../domain/constants';

// Central theme object — every component derives colors/spacing from here.
export const theme = {
  ...PALETTE,
  font: `system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`,
  mono: `ui-monospace, 'Cascadia Code', 'Segoe UI Mono', Menlo, Consolas, monospace`,
  headerH: 56,
  filterH: 48,
} as const;

export const card: React.CSSProperties = {
  background: theme.surface,
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radius,
  boxShadow: theme.shadow,
};

export const cardInteractive: React.CSSProperties = {
  ...card,
  transition: `box-shadow ${theme.transitionMedium} ${theme.easing}, border-color ${theme.transitionFast} ${theme.easing}`,
};

export const sectionLabel: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: '.07em',
  textTransform: 'uppercase',
  color: theme.textTertiary,
  fontFamily: theme.mono,
  lineHeight: 1.3,
};

export const numeric: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums',
  fontFamily: theme.mono,
};

export const chartGrid = theme.border;
