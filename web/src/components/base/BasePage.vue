<template>
  <div class="base-page" @scroll="$emit('scroll', $event)">
    <!-- Loader -->
    <BaseLoader v-if="isLoading" :text="loaderText" />

    <!-- Content -->
    <template v-else>
      <div v-if="compact" class="content-wrapper">
        <slot />
      </div>
      <div v-else :class="['page-container', { 'with-title': title }]">
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
  compact?: boolean;
}

withDefaults(defineProps<Props>(), {
  isLoading: false,
  loaderText: 'Loading...',
  title: '',
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
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: var(--spacing-xl);
  box-sizing: border-box;
}

.page-container {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  box-sizing: border-box;
}

.page-container.with-title {
  gap: 0;
}

.page-title {
  font-size: var(--font-size-xxl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
  margin: 0 0 var(--spacing-xl) 0;
  padding: 0 var(--spacing-xl);
  box-sizing: border-box;
}

/* Smooth transitions */
* {
  transition: border-color var(--transition-base) var(--transition-ease), box-shadow var(--transition-base) var(--transition-ease), background-color var(--transition-base) var(--transition-ease);
}
</style>

