<template>
  <div class="base-page" @scroll="$emit('scroll', $event)">
    <!-- Loader -->
    <BaseLoader v-if="isLoading" :text="loaderText" />

    <!-- Content -->
    <template v-else>
      <div v-if="compact" class="content-wrapper">
        <slot />
      </div>
      <div v-else :class="['page-container', { 'with-title': title }]" :style="{ maxWidth: maxWidth + 'px' }">
        <h2 v-if="title" class="page-title">{{ title }}</h2>
        <slot />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { withDefaults } from 'vue';
import BaseLoader from './BaseLoader.vue';

interface Props {
  isLoading?: boolean;
  loaderText?: string;
  title?: string;
  maxWidth?: number;
  compact?: boolean;
}

withDefaults(defineProps<Props>(), {
  isLoading: false,
  loaderText: 'Loading...',
  title: '',
  maxWidth: 1600,
  compact: false
});

defineEmits<{
  (e: 'scroll', event: Event): void;
}>()
</script>

<style scoped>
.base-page {
  height: 100%;
  overflow-y: auto;
  background: var(--color-secondary);
}

.content-wrapper {
  height: 100%;
}

.page-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  box-sizing: border-box;
}

.page-container.with-title {
  gap: 0;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 1.5rem 0;
  padding: 0 1.5rem;
  box-sizing: border-box;
}

/* Smooth transitions */
* {
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}
</style>

