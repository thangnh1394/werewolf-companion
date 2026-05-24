/**
 * Design tokens — "Bàn gỗ kể chuyện" direction.
 * Mirrored from docs/DESIGN.md. Single source of truth for runtime values.
 *
 * Tailwind classes that need exact tokens reference these via CSS variables
 * defined in index.css. Components that compute colors dynamically (e.g.,
 * avatar accent) import from here.
 */

export const colors = {
  bgBase: '#1F2419',
  bgSurface: '#2D3225',
  bgSurfaceHi: '#3D4533',
  bgInputIdle: '#4A4533',

  textPrimary: '#F5EFE0',
  textSecondary: '#8A8674',
  textMuted: '#5A5848',

  accent: '#E89B3C',
  accentDim: '#C99934',

  readyBg: '#4A6B2A',
  readyText: '#D4E8B0',

  danger: '#D85A30',
  dangerBorder: '#5A3027',
} as const;

export const typography = {
  fontFamily:
    '"Be Vietnam Pro", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
} as const;

export const radii = {
  sm: '6px',
  md: '8px',
  lg: '10px',
  xl: '12px',
  '2xl': '14px',
  '3xl': '18px',
} as const;
