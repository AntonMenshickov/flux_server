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
  min-height: var(--input-height);
  max-height: var(--input-height);
  min-width: 200px;
  box-sizing: border-box;
  padding: 0.6rem 0.8rem;
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border);
  font-size: var(--font-size-md);
  transition: border-color var(--transition-base), box-shadow var(--transition-base);
}

.base-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--box-shadow);
}
</style>
