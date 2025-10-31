<template>
  <div class="dropdown-wrapper" ref="dropdown">
    <div class="base-multiselect">
      <div v-if="localValue.length == 0" class="label">{{ label ?? 'Select value' }}</div>
      <div class="selected-items">
        <div v-for="(item, index) in localValue" :key="index" class="tag-badge">
          {{ buildLabel(item) }}
          <XMarkIcon @click="removeItem(index)" class="tag-badge-close" />
        </div>
      </div>
      <PlusIcon v-show="!showDropdown" @click="openDropdown" class="add-item" />
      <MinusIcon v-show="showDropdown" @click="closeDropdown" class="add-item" />
    </div>
    <div v-if="showDropdown" class="options">
      <div v-for="(option, index) in options" @mouseenter="optionHovered(option)" @click="toggleSelect(option)"
        :class="{ 'option': true, 'selected': localValue.includes(option) }" :key="index">
        {{ buildLabel(option) }}
        <CheckIcon v-if="localValue.includes(option) && hoveredOption != option" class="selected-icon" />
        <XMarkIcon v-if="localValue.includes(option) && hoveredOption == option" class="selected-icon" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends { toString(): string }">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { XMarkIcon, PlusIcon, MinusIcon, CheckIcon } from '@heroicons/vue/24/outline';

const props = defineProps<{
  modelValue?: Array<T> | null
  initialValue?: Array<T> | null
  options: Array<T>
  label?: string
  labelBuilder?: (item: T) => string
}>()

const showDropdown = ref<boolean>(false);
const hoveredOption = ref<T | null>(null);
const dropdown = ref<HTMLElement | null>(null);

const emit = defineEmits<{
  (e: 'update:modelValue', value: Array<T>): void
}>()

const localValue = computed({
  get: () => (props.modelValue ?? props.initialValue ?? []) as T[],
  set: (val: Array<T>) => emit('update:modelValue', val),
})

function handleClickOutside(event: MouseEvent) {
  if (!showDropdown.value) return;
  if (dropdown.value && !dropdown.value.contains(event.target as Node)) {
    showDropdown.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

function removeItem(index: number) {
  const newValue = [...localValue.value];
  newValue.splice(index, 1);
  localValue.value = newValue;
}

function buildLabel(item: T): string {
  if (props.labelBuilder) {
    return props.labelBuilder(item);
  }
  return item.toString();
}

function openDropdown() {
  showDropdown.value = true;
}

function closeDropdown() {
  showDropdown.value = false;
}

function optionHovered(option: T) {
  hoveredOption.value = option;
}

function toggleSelect(option: T) {
  if (localValue.value.includes(option)) {
    const newArray = [...localValue.value];
    localValue.value = newArray.filter(e => e !== option);
  } else {
    localValue.value = [...localValue.value, option]
  }

}

</script>

<style scoped>
.dropdown-wrapper {
  position: relative;
}

.options {
  position: absolute;
  top: 100%;
  width: 100%;
  padding: var(--spacing-sm) 0.8rem;
  border-radius: var(--border-radius-md);
  margin-top: 0.1rem;
  border: 1px solid var(--color-border);
  background-color: var(--color-white);
  box-sizing: border-box;
  box-shadow: var(--box-shadow-strong);
  z-index: var(--z-index-dropdown);
}

.options .option {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  text-align: start;
  padding: var(--spacing-sm) 0.8rem;
  margin: 0.1rem 0;
  border-radius: var(--border-radius-md);
  cursor: pointer;
}

.options .option:hover {
  background-color: var(--color-secondary);
}

.option .selected-icon {
  width: var(--icon-size-sm);
  height: var(--icon-size-sm);
  color: var(--color-secondary);
}

.option.selected {
  background-color: var(--color-accent);
  color: var(--color-secondary);
}

.option.selected:hover {
  background-color: var(--color-danger);
}

.base-multiselect {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  min-width: 220px;
  padding: var(--spacing-sm) 0.8rem;
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border);
  background-color: var(--color-white);
}

.selected-items {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: start;
}

.base-multiselect .label {
  color: var(--color-label-placeholder);
}

.add-item {
  cursor: pointer;
  width: var(--icon-size-md);
  height: var(--icon-size-md);
  padding: 0.1rem;
  border-radius: 50%;
}

.add-item:hover {
  background-color: var(--color-secondary);
}


.tag-badge {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background: var(--color-tag-bg);
  color: var(--color-tag-text);
  padding: 0.2rem var(--spacing-sm);
  padding-right: 0.4rem;
  margin-right: 0.2rem;
  border-radius: var(--border-radius-round);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.tag-badge .tag-badge-close {
  width: var(--icon-size-sm);
  height: var(--icon-size-sm);
  cursor: pointer;
}
</style>
