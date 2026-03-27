import { Injectable, signal, computed, effect } from '@angular/core';

const ACCENT_KEY = 'ofi_accent_color';
const THEME_KEY = 'ofi_theme_mode';
const DEFAULT_ACCENT = '#D047AE';

export type ThemeMode = 'Light' | 'Dark' | 'System';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly accent = signal(this.loadAccent());
  readonly themeMode = signal<ThemeMode>(this.loadTheme());

  /** Resolved boolean — true when dark mode is active (either explicit or via System) */
  readonly isDark = computed(() => {
    const mode = this.themeMode();
    if (mode === 'Dark') return true;
    if (mode === 'Light') return false;
    return this.systemPrefersDark();
  });

  /** Darker shade for gradients */
  readonly accentDark = computed(() => this.darken(this.accent(), 0.25));

  /** Shadow color with transparency */
  readonly accentShadow = computed(() => {
    const hex = this.accent();
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},0.35)`;
  });

  private systemPrefersDark = signal(false);
  private mediaQuery: MediaQueryList | null = null;

  constructor() {
    // Listen to OS dark mode changes for "System" setting
    if (typeof window !== 'undefined') {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.systemPrefersDark.set(this.mediaQuery.matches);
      this.mediaQuery.addEventListener('change', (e) => this.systemPrefersDark.set(e.matches));
    }
    // Apply theme attribute on <html> whenever isDark changes
    effect(() => {
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', this.isDark() ? 'dark' : 'light');
      }
    });
  }

  setAccent(color: string): void {
    this.accent.set(color);
    try { localStorage.setItem(ACCENT_KEY, color); } catch { /* SSR-safe */ }
  }

  setTheme(mode: ThemeMode): void {
    this.themeMode.set(mode);
    try { localStorage.setItem(THEME_KEY, mode); } catch { /* SSR-safe */ }
  }

  private loadAccent(): string {
    try { return localStorage.getItem(ACCENT_KEY) ?? DEFAULT_ACCENT; } catch { return DEFAULT_ACCENT; }
  }

  private loadTheme(): ThemeMode {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === 'Light' || stored === 'Dark' || stored === 'System') return stored;
      return 'Light';
    } catch { return 'Light'; }
  }

  private darken(hex: string, amount: number): string {
    const r = Math.max(0, Math.round(parseInt(hex.slice(1, 3), 16) * (1 - amount)));
    const g = Math.max(0, Math.round(parseInt(hex.slice(3, 5), 16) * (1 - amount)));
    const b = Math.max(0, Math.round(parseInt(hex.slice(5, 7), 16) * (1 - amount)));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
}
