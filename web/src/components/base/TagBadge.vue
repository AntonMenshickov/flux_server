<template>
  <BaseCopyText :decorated="false" @click="$emit('click', label)">
    <span class="tag-badge">{{ label }}</span>
  </BaseCopyText>
</template>

<script setup lang="ts">
import BaseCopyText from './BaseCopyText.vue';

defineProps<{
  label: string
}>();

defineEmits<{
  (e: 'click', value: string): void
}>();
</script>

<style scoped>
.tag-badge {
  background: var(--color-tag-bg);
  color: var(--color-tag-text);
  padding: 0.2rem var(--spacing-sm);
  border-radius: var(--border-radius-round);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  display: inline-block;
}
</style>
