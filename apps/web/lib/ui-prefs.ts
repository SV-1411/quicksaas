'use client';

export type ThemeName = 'starbucks' | 'ocean' | 'purple';

const THEME_KEY = 'gigzs_theme';
const FONT_SCALE_KEY = 'gigzs_font_scale';

export function getTheme(): ThemeName {
  if (typeof window === 'undefined') return 'starbucks';
  const t = window.localStorage.getItem(THEME_KEY) as ThemeName | null;
  return t ?? 'starbucks';
}

export function setTheme(theme: ThemeName) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(THEME_KEY, theme);
  document.documentElement.dataset.theme = theme;
}

export function getFontScale(): number {
  if (typeof window === 'undefined') return 1;
  const raw = window.localStorage.getItem(FONT_SCALE_KEY);
  const v = raw ? Number(raw) : 1;
  return Number.isFinite(v) ? Math.min(1.25, Math.max(0.85, v)) : 1;
}

export function setFontScale(scale: number) {
  if (typeof window === 'undefined') return;
  const v = Math.min(1.25, Math.max(0.85, scale));
  window.localStorage.setItem(FONT_SCALE_KEY, String(v));
  document.documentElement.style.setProperty('--font-scale', String(v));
}

export function applyUiPrefsFromStorage() {
  if (typeof window === 'undefined') return;
  document.documentElement.dataset.theme = getTheme();
  document.documentElement.style.setProperty('--font-scale', String(getFontScale()));
}
