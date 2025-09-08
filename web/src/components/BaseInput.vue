<template>
  <input
    v-bind="$attrs"
    v-model="localValue"
    class="base-input"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ modelValue?: string }>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const localValue = computed<string>({
  get: () => props.modelValue ?? '',
  set: (val: string) => emit('update:modelValue', val),
})
</script>

<style scoped>
.base-input {
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  border: 1px solid var(--color-on-primary);
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.base-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(100, 150, 250, 0.2);
}
</style>