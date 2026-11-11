/**
 * Tokens semánticos y primitivos del Sistema de Diseño C.A.S.A. (sincronizados con
 * `casa_fe/design-system/styles/1-primitives.css`, `2-tokens.css` y `app/globals-1.css`).
 */

export type ChipColor =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'lime'
  | 'green'
  | 'teal'
  | 'cyan'
  | 'blue'
  | 'navy'
  | 'indigo'
  | 'purple'
  | 'pink'
  | 'gray';

export const CasaColors = {
  // Superficies principales y texto (derivados de --navy UMSS y globals-1.css)
  background: '#f6f8fb', // oklch(from var(--navy) 0.975 0.004 h)
  foreground: '#1e2f44', // oklch(from var(--navy) 0.27407 0.06673 h)
  card: '#ffffff',
  cardForeground: '#0f172a',
  popover: '#ffffff',
  popoverForeground: '#1e2f44',

  // Azul institucional UMSS / C.A.S.A.
  primary: '#003770',
  primaryHover: '#002b59',
  primaryForeground: '#ffffff',
  primarySoftBg: '#e6eef7',
  primarySoftBorder: '#b3cce6',
  authBg: '#001B47', // --sidebar / --auth-bg

  // Secundario, Muted y Acento
  secondary: '#e4ecf5', // oklch(from var(--navy) 0.94 0.03 h)
  secondaryForeground: '#002247', // oklch(from var(--navy) 0.22 0.085 h)
  muted: '#f0f4f8',
  mutedForeground: '#6b7280',
  accent: '#e4ecf5',
  accentForeground: '#002247',

  // Estados semánticos
  destructive: '#BC000C',
  destructiveForeground: '#ffffff',
  destructiveSoftBg: '#fde8e9',
  destructiveSoftBorder: '#f8b4b8',

  success: '#16a34a',
  successForeground: '#ffffff',
  warning: '#d97706',
  warningForeground: '#171717',
  info: '#2563eb',
  infoForeground: '#ffffff',

  // Bordes y Controles de formulario (Reglas 5, 6 y 7 de AGENTS.md / design.md)
  border: '#e5e7eb',
  inputBorder: '#adb2ba', // Regla 7: borde nítido y claramente visible (--input / --neutral-400)
  selectBorder: '#adb2ba',
  comboboxBorder: '#adb2ba',
  checkboxBorder: '#64748b', // Regla 5: --checkbox-border (var(--neutral-500))
  tableDivider: '#e2e8f0', // Regla 6: --table-divider
  tableHeader: '#f8fafc', // Regla 6: --table-header
  ring: '#c5cfe4',
} as const;

/**
 * Paleta de 13 familias de color para Badge y StatStrip (`chipColorClasses` de `casa_fe`).
 */
export const CasaChipPalette: Record<
  ChipColor,
  { bg: string; fg: string; border: string; dot: string }
> = {
  red: { bg: '#fee2e2', fg: '#991b1b', border: '#fecaca', dot: '#ef4444' },
  orange: { bg: '#ffedd5', fg: '#9a3412', border: '#fed7aa', dot: '#f97316' },
  yellow: { bg: '#fef3c7', fg: '#92400e', border: '#fde68a', dot: '#f59e0b' },
  lime: { bg: '#ecfccb', fg: '#3f6212', border: '#d9f99d', dot: '#84cc16' },
  green: { bg: '#dcfce7', fg: '#15803d', border: '#bbf7d0', dot: '#22c55e' },
  teal: { bg: '#ccfbf1', fg: '#115e59', border: '#99f6e4', dot: '#14b8a6' },
  cyan: { bg: '#cffafe', fg: '#155e75', border: '#a5f3fc', dot: '#06b6d4' },
  blue: { bg: '#dbeafe', fg: '#1e40af', border: '#bfdbfe', dot: '#3b82f6' },
  navy: { bg: '#e0eaf5', fg: '#003770', border: '#bfd3ea', dot: '#003770' },
  indigo: { bg: '#e0e7ff', fg: '#3730a3', border: '#c7d2fe', dot: '#6366f1' },
  purple: { bg: '#f3e8ff', fg: '#6b21a8', border: '#e9d5ff', dot: '#a855f7' },
  pink: { bg: '#fce7f3', fg: '#9d174d', border: '#fbcfe8', dot: '#ec4899' },
  gray: { bg: '#f3f4f6', fg: '#4b5563', border: '#e5e7eb', dot: '#6b7280' },
};

export const CasaRadius = {
  sm: 6,
  md: 8,
  lg: 10, // --radius: 0.625rem (10px)
  xl: 14,
  '2xl': 18,
  '3xl': 22,
  '4xl': 24,
  full: 9999,
} as const;

