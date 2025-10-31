<template>
  <img alt="Flux logo" :src="logoSrc">
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useThemeStore } from '@/stores/themeStore';
import logoOnLight from '@/assets/logo_on_light.svg';
import logoOnDark from '@/assets/logo_on_dark.svg';

const themeStore = useThemeStore();

const logoSrc = computed(() => {
  return themeStore.effectiveTheme === 'dark' ? logoOnDark : logoOnLight;
});
</script>

<style scoped>
img {
  width: 300px;
  padding: 1em;
}
</style>