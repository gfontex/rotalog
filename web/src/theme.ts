// Configuracao de temas (modo escuro e modo claro) e estilos dos componentes

export type AppThemeId = 'rotalog-navy' | 'titanium-light';

export interface AppThemeOption {
  id: AppThemeId;
  name: string;
  shortName: string;
  isLight: boolean;
}

export const APP_THEMES: AppThemeOption[] = [
  {
    id: 'rotalog-navy',
    name: 'Modo Escuro',
    shortName: 'Escuro',
    isLight: false,
  },
  {
    id: 'titanium-light',
    name: 'Modo Claro',
    shortName: 'Claro',
    isLight: true,
  },
];

export const ASSETS = {
  logo: '/images/logo-rotalog.jpg',
  heroBanner: '/images/fleet-hero-banner.jpg',
  vehiclePlaceholder: '/images/vehicle-placeholder.jpg',
  emptyState: '/images/empty-state-corporate.jpg',
} as const;

export const UI_TOKENS = {
  pageBg: 'min-h-screen bg-surface-bg text-content-primary selection:bg-brand-primary selection:text-white',
  card: 'bg-surface-card border border-surface-border rounded-2xl shadow-sm',
  cardElevated: 'bg-surface-elevated border border-surface-border rounded-xl',
  input:
    'w-full px-3.5 py-2.5 bg-surface-bg border border-surface-border rounded-xl text-sm text-content-primary placeholder-content-muted focus:outline-none focus:border-brand-primary transition-colors',
  btnPrimary:
    'keep-white px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover active:scale-[0.99] disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer',
  btnSecondary:
    'px-4 py-2.5 rounded-xl bg-surface-elevated hover:border-brand-primary/40 border border-surface-border text-content-primary font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer',
  badgeSuccess: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25',
  badgeWarning: 'bg-amber-500/10 text-amber-400 border border-amber-500/25',
  badgeDanger: 'bg-rose-500/10 text-rose-400 border border-rose-500/25',
  badgeInfo: 'bg-sky-500/10 text-sky-400 border border-sky-500/25',
  badgeAdmin: 'bg-purple-500/10 text-purple-400 border border-purple-500/25',
} as const;
