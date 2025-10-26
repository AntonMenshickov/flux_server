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
  width: 1.1rem;
}

.date-picker {
  width: auto;
}

.date-time-display {
  display: flex;
  min-width: 200px;
  min-height: 40px;
  max-height: 40px;
  box-sizing: border-box;
  align-items: center;
  padding: 0.6rem 0.8rem;
  padding-right: 2rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  font-size: 0.9rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  color: var(--color-text-dimmed);
  background-color: white;
}

.date-time-display-icon {
  width: 1.2rem;
  height: 1.2rem;
  margin-right: 0.5rem;
}
</style>
