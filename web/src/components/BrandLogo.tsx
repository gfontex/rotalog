'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Clock, ClipboardCheck, Car, Palette, Check } from 'lucide-react';

export type AppThemeId =
  | 'rotalog-navy'
  | 'obsidian-emerald'
  | 'cyber-royal'
  | 'sunset-amber'
  | 'titanium-light';

export interface AppThemeOption {
  id: AppThemeId;
  name: string;
  shortName: string;
  badgeColor: string;
  previewBg: string;
  previewCard: string;
  previewAccent: string;
  isLight: boolean;
}

export const APP_THEMES: AppThemeOption[] = [
  {
    id: 'rotalog-navy',
    name: 'RotaLog Original (Navy & Ciano)',
    shortName: 'Navy',
    badgeColor: '#0EA5E9',
    previewBg: '#040D21',
    previewCard: '#0A1633',
    previewAccent: '#1D9BF0',
    isLight: false,
  },
  {
    id: 'obsidian-emerald',
    name: 'Obsidian Tático (Esmeralda)',
    shortName: 'Obsidian',
    badgeColor: '#10B981',
    previewBg: '#060B11',
    previewCard: '#0E1722',
    previewAccent: '#10B981',
    isLight: false,
  },
  {
    id: 'cyber-royal',
    name: 'Royal Command (Safira & Violeta)',
    shortName: 'Royal',
    badgeColor: '#8B5CF6',
    previewBg: '#09071A',
    previewCard: '#13112E',
    previewAccent: '#8B5CF6',
    isLight: false,
  },
  {
    id: 'sunset-amber',
    name: 'Via Expressa (Grafite & Âmbar)',
    shortName: 'Via Expressa',
    badgeColor: '#F59E0B',
    previewBg: '#0D0E12',
    previewCard: '#171922',
    previewAccent: '#F59E0B',
    isLight: false,
  },
  {
    id: 'titanium-light',
    name: 'Titanium Claro (Diurno Executivo)',
    shortName: 'Claro',
    badgeColor: '#0284C7',
    previewBg: '#F1F5F9',
    previewCard: '#FFFFFF',
    previewAccent: '#0284C7',
    isLight: true,
  },
];

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
      // Ignore storage quota / restricted context errors
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
        className="flex items-center gap-1.5 bg-[#070B14] border border-slate-800 rounded-xl px-2 py-1"
        role="group"
        aria-label="Selecionar aparência do sistema"
      >
        <Palette className="w-3.5 h-3.5 text-sky-400 shrink-0 hidden sm:block" />
        <div className="flex items-center gap-1">
          {APP_THEMES.map((item) => {
            const active = theme === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTheme(item.id)}
                title={item.name}
                aria-label={`Aparência: ${item.name}`}
                aria-pressed={active}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  active
                    ? 'keep-white ring-2 ring-sky-400 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                style={{
                  backgroundColor: active ? item.previewAccent : 'transparent',
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full border border-white/40 shrink-0"
                  style={{ backgroundColor: item.previewBg }}
                />
                <span className="hidden xl:inline">{item.shortName}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-center gap-1.5 mb-2">
        <Palette className="w-3.5 h-3.5 text-sky-400" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Escolha a Aparência do Site
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {APP_THEMES.map((item) => {
          const active = theme === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTheme(item.id)}
              aria-pressed={active}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                active
                  ? 'border-sky-400 bg-sky-500/15 text-sky-300 shadow-lg shadow-sky-500/15 scale-[1.02]'
                  : 'border-slate-800 bg-[#0F172A]/80 text-slate-300 hover:border-slate-600'
              }`}
            >
              <span className="flex items-center -space-x-1">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-white/30"
                  style={{ backgroundColor: item.previewBg }}
                />
                <span
                  className="w-3.5 h-3.5 rounded-full border border-white/30"
                  style={{ backgroundColor: item.previewAccent }}
                />
              </span>
              <span>{item.shortName}</span>
              {active && <Check className="w-3 h-3 text-sky-400" />}
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
      <div className="logo-navy-box w-11 h-11 rounded-xl bg-[#040D21] border border-sky-400/40 overflow-hidden shadow-lg shadow-sky-500/20 flex items-center justify-center shrink-0">
        <img
          src="/logo-rotalog.jpg"
          alt="Logo RotaLog Controle de Frotas"
          className="w-full h-full object-cover scale-110"
        />
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-lg sm:text-xl font-black italic tracking-tight text-white">
            Rota<span className="text-[#1D9BF0]">Log</span>
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
      {/* Glow radial azul elétrico da marca */}
      <div className="relative group">
        <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-sky-500/30 via-blue-600/20 to-cyan-400/30 blur-xl opacity-80 group-hover:opacity-100 transition-opacity" />
        <div className="logo-navy-box relative w-52 sm:w-64 rounded-3xl bg-[#040D21] border border-sky-500/30 p-3 shadow-2xl shadow-sky-500/20 overflow-hidden">
          <img
            src="/logo-rotalog.jpg"
            alt="RotaLog — Controle de Frotas"
            className="w-full h-auto rounded-2xl object-contain"
          />
        </div>
      </div>

      {/* Tipografia oficial e pilares */}
      <div className="mt-4 flex flex-col items-center">
        <div className="flex items-center gap-2.5">
          <span className="h-[1px] w-8 bg-gradient-to-r from-transparent to-sky-400/70" />
          <span className="text-[11px] font-black tracking-[0.26em] text-sky-400 uppercase">
            CONTROLE DE FROTAS
          </span>
          <span className="h-[1px] w-8 bg-gradient-to-l from-transparent to-sky-400/70" />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/25 text-xs font-bold text-sky-300">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            Ponto CLT
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/25 text-xs font-bold text-sky-300">
            <ClipboardCheck className="w-3.5 h-3.5 text-sky-400" />
            Check List
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/25 text-xs font-bold text-sky-300">
            <Car className="w-3.5 h-3.5 text-sky-400" />
            Gestão de Frotas
          </span>
        </div>
      </div>
    </div>
  );
}
