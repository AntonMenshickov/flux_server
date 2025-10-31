<template>
  <VueDatePicker v-model="dateModel" @update:model-value="handleUpdate" @cleared="handleCleared" range
    :multiCalendars="{ solo: true }" class="date-picker">
    <template #dp-input="{ value }">
      <div v-show="value.length" class="date-time-display">
        <CalendarDaysIcon  class="date-time-display-icon"/>
        {{ value }}
      </div>
      <BaseButton v-show="!value.length" class="primary" title="Set date time filter">
        <CalendarDateRangeIcon class="search-action-button" />
        Date filter
      </BaseButton>
    </template>
  </VueDatePicker>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import BaseButton from '../base/BaseButton.vue';
import { CalendarDateRangeIcon, CalendarDaysIcon } from '@heroicons/vue/24/outline';

const props = defineProps<{
  modelValue: Date[] | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: Date[] | null): void;
}>();

const dateModel = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

function handleUpdate(value: Date[] | null) {
  emit('update:modelValue', value);
}

function handleCleared() {
  emit('update:modelValue', null);
}
</script>

<style scoped>
.search-action-button {
  width: 1.25rem;
}

.date-picker {
  width: auto;
}

.date-time-display {
  display: flex;
  min-width: 200px;
  min-height: var(--input-height);
  max-height: var(--input-height);
  box-sizing: border-box;
  align-items: center;
  padding: 0.6rem 0.8rem;
  padding-right: 2rem;
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border);
  font-size: var(--font-size-base);
  transition: border-color var(--transition-base), box-shadow var(--transition-base);
  color: var(--color-text);
  background-color: var(--color-panel-bg);
}

.date-time-display-icon {
  width: var(--icon-size-md);
  height: var(--icon-size-md);
  margin-right: var(--spacing-sm);
}
</style>
