<template>
  <button v-bind="$attrs" @click="$emit('click')" class="base-btn">
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
defineEmits<{
  (e: 'click'): void
}>()
</script>

<style scoped>
.base-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  white-space: nowrap;
  height: var(--button-height);
  padding: 0 var(--spacing-xl);
  min-height: var(--button-height);
  box-sizing: border-box;
  border: none;
  border-radius: var(--border-radius-md);
  background-color: var(--color-primary);
  color: var(--color-secondary);
  cursor: pointer;
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-base);
  font-size: var(--font-size-md);
}

.base-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
.base-btn.primary {
  background-color: var(--color-accent);
}
.base-btn.danger {
  background-color: var(--color-danger);
}
</style>
