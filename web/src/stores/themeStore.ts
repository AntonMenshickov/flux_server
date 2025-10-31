import { defineStore } from 'pinia';

export type ThemeMode = 'light' | 'dark' | 'system';

export const useThemeStore = defineStore('theme', {
  state: () => ({
    theme: 'system' as ThemeMode,
  }),
  getters: {
    effectiveTheme: (state): 'light' | 'dark' => {
      if (state.theme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return state.theme;
    },
  },
  actions: {
    setTheme(theme: ThemeMode) {
      this.theme = theme;
      this.applyTheme();
    },
    applyTheme() {
      const effectiveTheme = this.effectiveTheme;
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(effectiveTheme);
    },
    initTheme() {
      // Listen for system theme changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (this.theme === 'system') {
          this.applyTheme();
        }
      });
      this.applyTheme();
    },
  },
  persist: true,
});

