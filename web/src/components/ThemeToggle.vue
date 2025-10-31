<template>
  <button class="theme-toggle" @click="toggleTheme" :title="getTitle()">
    <SunIcon v-if="themeStore.theme === 'dark'" class="theme-icon" />
    <MoonIcon v-else-if="themeStore.theme === 'light'" class="theme-icon" />
    <ComputerDesktopIcon v-else class="theme-icon" />
  </button>
</template>

<script setup lang="ts">
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/vue/24/outline';
import { useThemeStore, type ThemeMode } from '@/stores/themeStore';

const themeStore = useThemeStore();

function toggleTheme() {
  const themes: ThemeMode[] = ['light', 'dark', 'system'];
  const currentIndex = themes.indexOf(themeStore.theme);
  const nextIndex = (currentIndex + 1) % themes.length;
  themeStore.setTheme(themes[nextIndex]);
}

function getTitle(): string {
  const titles: Record<ThemeMode, string> = {
    light: 'Light theme',
    dark: 'Dark theme',
    system: 'System theme',
  };
  return titles[themeStore.theme] || 'Switch theme';
}
</script>

<style scoped>
.theme-toggle {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: var(--spacing-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  transition: color var(--transition-base);
}

.theme-toggle:hover {
  color: var(--color-accent);
}

.theme-icon {
  width: var(--icon-size-xl);
  height: var(--icon-size-xl);
}
</style>

