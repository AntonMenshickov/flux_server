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
  gap: 1.5rem;
  flex-wrap: wrap;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.header-main {
  display: flex;
  align-items: start;
  gap: 1rem;
  flex: 1;
  min-width: 0;
}

.back-button {
  width: 2rem;
  height: 2rem;
  cursor: pointer;
  color: var(--color-text-dimmed);
  transition: color 0.2s ease, transform 0.2s ease;
}

.back-button:hover {
  color: var(--color-text);
  transform: translateX(-2px);
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.header-info-row {
  flex-direction: row;
  align-items: center;
}

.header-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  line-height: 1.2;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-subtitle {
  font-size: 0.875rem;
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
  gap: 1rem;
  flex-wrap: wrap;
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-section {
    flex-direction: column;
    align-items: stretch;
  }

  .header-title {
    font-size: 1.5rem;
  }
}

/* Smooth transitions */
* {
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}
</style>

