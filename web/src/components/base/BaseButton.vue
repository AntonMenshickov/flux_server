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
  gap: 0.5rem;
  white-space: nowrap;
  height: 40px;
  padding: 0 1.25rem;
  min-height: 40px;
  box-sizing: border-box;
  border: none;
  border-radius: 8px;
  background-color: var(--color-primary);
  color: var(--color-secondary);
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  font-size: 0.95rem;
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
