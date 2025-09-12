<template>
  <input
    v-bind="$attrs"
    v-model="localValue"
    class="base-input"
    :readonly="readonly"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue?: string | null
  initialValue?: string
  readonly?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const localValue = computed<string>({
  get: () => props.modelValue ?? props.initialValue ?? '',
  set: (val: string) => emit('update:modelValue', val),
})
</script>

<style scoped>
.base-input {
  min-height: 40px;
  box-sizing: border-box;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.base-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(100, 150, 250, 0.2);
}
</style>
