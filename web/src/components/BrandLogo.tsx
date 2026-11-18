'use client';

// Logo do sistema e alternancia entre modo escuro e modo claro

import React, { useState, useEffect, useCallback } from 'react';
import { Clock, ClipboardCheck, Car, Sun, Moon } from 'lucide-react';
import { APP_THEMES, AppThemeId, ASSETS } from '../theme';

const THEME_STORAGE_KEY = '@rotalog:theme';
const THEME_EVENT_NAME = 'rotalog:theme-updated';

function applyThemeToDocument(themeId: AppThemeId) {
  if (typeof document === 'undefined') return;
  const themeConfig = APP_THEMES.find((t) => t.id === themeId) || APP_THEMES[0];
  document.documentElement.setAttribute('data-theme', themeConfig.id);
  document.documentElement.classList.toggle('dark', !themeConfig.isLight);

  let metaColorScheme = document.querySelector('meta[name="color-scheme"]');
  if (!metaColorScheme) {
    metaColorScheme = document.createElement('meta');
    metaColorScheme.setAttribute('name', 'color-scheme');
    document.head.appendChild(metaColorScheme);
  }
  metaColorScheme.setAttribute('content', themeConfig.isLight ? 'light' : 'dark');
}

export function useAppTheme() {
  const [theme, setThemeState] = useState<AppThemeId>('rotalog-navy');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as AppThemeId | null;
      const valid = saved && APP_THEMES.some((t) => t.id === saved) ? saved : 'rotalog-navy';
      setThemeState(valid);
      applyThemeToDocument(valid);
    } catch {
      applyThemeToDocument('rotalog-navy');
    }

    const handleSync = (evt: Event) => {
      const customEvt = evt as CustomEvent<AppThemeId>;
      if (customEvt.detail && APP_THEMES.some((t) => t.id === customEvt.detail)) {
        setThemeState(customEvt.detail);
        applyThemeToDocument(customEvt.detail);
      }
    };

    const handleStorage = (evt: StorageEvent) => {
      if (evt.key === THEME_STORAGE_KEY && evt.newValue && APP_THEMES.some((t) => t.id === evt.newValue)) {
        const next = evt.newValue as AppThemeId;
        setThemeState(next);
        applyThemeToDocument(next);
      }
    };

    window.addEventListener(THEME_EVENT_NAME, handleSync);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(THEME_EVENT_NAME, handleSync);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const setTheme = useCallback((nextTheme: AppThemeId) => {
    setThemeState(nextTheme);
    applyThemeToDocument(nextTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // Ignore storage quota errors
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent<AppThemeId>(THEME_EVENT_NAME, { detail: nextTheme }));
    }
  }, []);

  const currentTheme = APP_THEMES.find((t) => t.id === theme) || APP_THEMES[0];
  return { theme, setTheme, currentTheme, themes: APP_THEMES };
}

export function ThemeSwitcherBar({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useAppTheme();

  if (compact) {
    return (
      <div
        className="flex items-center gap-1 bg-surface-bg border border-surface-border rounded-xl p-1"
        role="group"
        aria-label="Selecionar tema claro ou escuro"
      >
        {APP_THEMES.map((item) => {
          const active = theme === item.id;
          const Icon = item.isLight ? Sun : Moon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTheme(item.id)}
              title={item.name}
              aria-label={item.name}
              aria-pressed={active}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                active
                  ? 'keep-white bg-brand-primary text-white shadow-sm'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{item.shortName}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <div
        className="inline-flex items-center gap-1.5 bg-surface-card border border-surface-border rounded-2xl p-1.5"
        role="group"
        aria-label="Alternar entre Modo Escuro e Modo Claro"
      >
        {APP_THEMES.map((item) => {
          const active = theme === item.id;
          const Icon = item.isLight ? Sun : Moon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTheme(item.id)}
              aria-pressed={active}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                active
                  ? 'keep-white bg-brand-primary text-white shadow-sm'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function RotaLogHeaderBrand() {
  return (
    <div className="flex items-center gap-3">
      <div className="logo-navy-box w-11 h-11 rounded-xl bg-surface-logo border border-sky-400/40 overflow-hidden flex items-center justify-center shrink-0">
        <img
          src={ASSETS.logo}
          alt="Logo RotaLog Controle de Frotas"
          className="w-full h-full object-cover scale-110"
        />
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-lg sm:text-xl font-black italic tracking-tight text-content-primary">
            Rota<span className="text-brand-primary">Log</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-[1px] w-2.5 bg-sky-400/60" />
          <span className="text-[9px] font-extrabold tracking-[0.2em] text-sky-400 uppercase">
            CONTROLE DE FROTAS
          </span>
          <span className="h-[1px] w-2.5 bg-sky-400/60" />
        </div>
      </div>
    </div>
  );
}

export function RotaLogBrandHero() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative group">
        <div className="logo-navy-box relative w-52 sm:w-60 rounded-2xl bg-surface-logo border border-sky-500/30 p-3 overflow-hidden">
          <img
            src={ASSETS.logo}
            alt="RotaLog — Controle de Frotas"
            className="w-full h-auto rounded-xl object-contain"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center">
        <div className="flex items-center gap-2.5">
          <span className="h-[1px] w-8 bg-gradient-to-r from-transparent to-sky-400/70" />
          <span className="text-[11px] font-black tracking-[0.26em] text-sky-400 uppercase">
            CONTROLE DE FROTAS
          </span>
          <span className="h-[1px] w-8 bg-gradient-to-l from-transparent to-sky-400/70" />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/25 text-xs font-bold text-sky-400">
            <Clock className="w-3.5 h-3.5" />
            Ponto CLT
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/25 text-xs font-bold text-sky-400">
            <ClipboardCheck className="w-3.5 h-3.5" />
            Check List
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/25 text-xs font-bold text-sky-400">
            <Car className="w-3.5 h-3.5" />
            Gestão de Frotas
          </span>
        </div>
      </div>
    </div>
  );
}

export function CorporateEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="py-10 px-4 flex flex-col items-center justify-center text-center">
      <div className="logo-navy-box w-24 h-24 rounded-2xl border border-sky-500/25 overflow-hidden mb-3">
        <img
          src={ASSETS.emptyState}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>
      <h4 className="text-sm font-bold text-content-primary">{title}</h4>
      <p className="text-xs text-content-secondary max-w-sm mt-1">{description}</p>
    </div>
  );
}
