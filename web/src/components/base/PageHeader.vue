<template>
  <div class="header-section">
    <div class="header-main">
      <ArrowLeftIcon @click="$emit('back')" class="back-button" />
      <div :class="['header-info', { 'header-info-row': subtitleInline }]">
        <h1 class="header-title">{{ title }}</h1>
        <p v-if="subtitle" class="header-subtitle">{{ subtitle }}</p>
      </div>
    </div>
    <div v-if="$slots.right" class="header-right">
      <slot name="right"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeftIcon } from '@heroicons/vue/24/outline';

defineProps<{
  title: string;
  subtitle?: string;
  subtitleInline?: boolean;
}>();

defineEmits<{
  back: [];
}>();
</script>

<style scoped>
.header-section {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-xl);
  flex-wrap: wrap;
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border-subtle);
}

.header-main {
  display: flex;
  align-items: start;
  gap: var(--spacing-lg);
  flex: 1;
  min-width: 0;
}

.back-button {
  width: var(--icon-size-xxl);
  height: var(--icon-size-xxl);
  cursor: pointer;
  color: var(--color-text-dimmed);
  transition: color var(--transition-base) var(--transition-ease), transform var(--transition-base) var(--transition-ease);
}

.back-button:hover {
  color: var(--color-text);
  transform: translateX(-2px);
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  min-width: 0;
}

.header-info-row {
  flex-direction: row;
  align-items: center;
}

.header-title {
  font-size: var(--font-size-xxxl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
  margin: 0;
  line-height: 1.2;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-subtitle {
  font-size: var(--font-size-base);
  color: var(--color-text-dimmed);
  margin: 0;
  font-family: monospace;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-section {
    flex-direction: column;
    align-items: stretch;
  }

  .header-title {
    font-size: var(--font-size-xl);
  }
}

/* Smooth transitions */
* {
  transition: border-color var(--transition-base) var(--transition-ease), box-shadow var(--transition-base) var(--transition-ease), background-color var(--transition-base) var(--transition-ease);
}
</style>

