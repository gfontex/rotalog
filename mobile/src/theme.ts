// ============================================================================
// ROTALOG DESIGN SYSTEM — ENTERPRISE TOKENS (MOBILE / EXPO)
// Centraliza superfícies, marca, tipografia, semânticas e grid 4px/8px
// ============================================================================

export type ThemeMode = 'dark' | 'light';

export interface SemanticToken {
  main: string;
  pressed: string;
  bg: string;
  border: string;
}

export interface ThemeTokens {
  id: ThemeMode;
  label: string;
  shortLabel: string;
  isLight: boolean;
  surfaces: {
    background: string;
    card: string;
    elevated: string;
    input: string;
    disabled: string;
    border: string;
    overlay: string;
    logoContainer: string;
  };
  brand: {
    primary: string;
    primaryPressed: string;
    primarySubtle: string;
    primaryBorder: string;
    secondary: string;
    secondarySubtle: string;
    secondaryBorder: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
  };
  semantic: {
    success: SemanticToken;
    warning: SemanticToken;
    danger: SemanticToken;
    info: SemanticToken;
    admin: SemanticToken;
  };
}

// Escala de espaçamento múltipla de 4px / 8px
export const SPACING = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const RADIUS = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const TYPOGRAPHY = {
  display: 32,
  h1: 24,
  h2: 18,
  h3: 15,
  body: 14,
  bodySm: 13,
  caption: 12,
  tiny: 10,
} as const;

export const THEMES: Record<ThemeMode, ThemeTokens> = {
  dark: {
    id: 'dark',
    label: 'Modo Escuro',
    shortLabel: 'Escuro',
    isLight: false,
    surfaces: {
      background: '#040D21',
      card: '#0A1633',
      elevated: '#0F2147',
      input: '#061129',
      disabled: '#091326',
      border: '#1A3163',
      overlay: 'rgba(4, 13, 33, 0.78)',
      logoContainer: '#040D21',
    },
    brand: {
      primary: '#1D9BF0',
      primaryPressed: '#0284C7',
      primarySubtle: 'rgba(29, 155, 240, 0.12)',
      primaryBorder: 'rgba(29, 155, 240, 0.32)',
      secondary: '#2563EB',
      secondarySubtle: 'rgba(37, 99, 235, 0.14)',
      secondaryBorder: 'rgba(37, 99, 235, 0.32)',
    },
    text: {
      primary: '#F8FAFC',
      secondary: '#94A3B8',
      muted: '#64748B',
      inverse: '#FFFFFF',
    },
    semantic: {
      success: {
        main: '#10B981',
        pressed: '#059669',
        bg: 'rgba(16, 185, 129, 0.12)',
        border: 'rgba(16, 185, 129, 0.32)',
      },
      warning: {
        main: '#F59E0B',
        pressed: '#D97706',
        bg: 'rgba(245, 158, 11, 0.12)',
        border: 'rgba(245, 158, 11, 0.32)',
      },
      danger: {
        main: '#EF4444',
        pressed: '#DC2626',
        bg: 'rgba(239, 68, 68, 0.12)',
        border: 'rgba(239, 68, 68, 0.32)',
      },
      info: {
        main: '#3B82F6',
        pressed: '#2563EB',
        bg: 'rgba(59, 130, 246, 0.12)',
        border: 'rgba(59, 130, 246, 0.32)',
      },
      admin: {
        main: '#8B5CF6',
        pressed: '#7C3AED',
        bg: 'rgba(139, 92, 246, 0.12)',
        border: 'rgba(139, 92, 246, 0.32)',
      },
    },
  },
  light: {
    id: 'light',
    label: 'Modo Claro',
    shortLabel: 'Claro',
    isLight: true,
    surfaces: {
      background: '#F1F5F9',
      card: '#FFFFFF',
      elevated: '#F8FAFC',
      input: '#F8FAFC',
      disabled: '#E2E8F0',
      border: '#CBD5E1',
      overlay: 'rgba(15, 23, 42, 0.65)',
      logoContainer: '#040D21',
    },
    brand: {
      primary: '#0284C7',
      primaryPressed: '#0369A1',
      primarySubtle: 'rgba(2, 132, 199, 0.10)',
      primaryBorder: 'rgba(2, 132, 199, 0.28)',
      secondary: '#2563EB',
      secondarySubtle: 'rgba(37, 99, 235, 0.10)',
      secondaryBorder: 'rgba(37, 99, 235, 0.28)',
    },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
      muted: '#64748B',
      inverse: '#FFFFFF',
    },
    semantic: {
      success: {
        main: '#059669',
        pressed: '#047857',
        bg: 'rgba(5, 150, 105, 0.10)',
        border: 'rgba(5, 150, 105, 0.28)',
      },
      warning: {
        main: '#D97706',
        pressed: '#B45309',
        bg: 'rgba(217, 119, 6, 0.10)',
        border: 'rgba(217, 119, 6, 0.28)',
      },
      danger: {
        main: '#DC2626',
        pressed: '#B91C1C',
        bg: 'rgba(220, 38, 38, 0.10)',
        border: 'rgba(220, 38, 38, 0.28)',
      },
      info: {
        main: '#2563EB',
        pressed: '#1D4ED8',
        bg: 'rgba(37, 99, 235, 0.10)',
        border: 'rgba(37, 99, 235, 0.28)',
      },
      admin: {
        main: '#7C3AED',
        pressed: '#6D28D9',
        bg: 'rgba(124, 58, 237, 0.10)',
        border: 'rgba(124, 58, 237, 0.28)',
      },
    },
  },
};
