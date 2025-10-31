<template>
  <div :class="{ 'selector-wrapper': true, opened: showDropdown }" ref="dropdown">
    <BaseInput v-model="search" @input="onSearch" @click="openDropdown" :placeholder="placeholder"
      :class="{ 'selector-input': true, opened: showDropdown }" />

    <ul v-if="showDropdown" class="dropdown">
      <li v-for="item in options" :key="valueKey(item as T)" @click="selectOption(item as T)">
        {{ labelKey(item as T) }}
      </li>
      <li v-if="loading" class="loading">loading...</li>
      <li v-if="!loading && options.length === 0" class="no-results">
        No results
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts" generic="T">
import { debounce } from 'lodash'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import BaseInput from './BaseInput.vue'

const props = defineProps<{
  modelValue: T | null
  fetchOptions: (query: string) => Promise<T[]>
  labelKey: (item: T) => string
  valueKey: (item: T) => string
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: T | null): void
}>()

const search = ref('')
const options = ref<T[]>([])
const loading = ref(false)
const showDropdown = ref(false)
const dropdown = ref<HTMLElement | null>(null);

const debouncedSearch = debounce(fetchData, 200);

watch(
  () => props.modelValue,
  (val) => {
    if (!val) {
      search.value = '';
      return;
    }
    const found = options.value.find((o) => props.valueKey(o as T) === props.valueKey(val));
    if (found) search.value = props.labelKey(found as T);
  },
  { immediate: true }
)


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

async function fetchData() {
  options.value = await props.fetchOptions(search.value.trim());
}

const openDropdown = async () => {
  if (showDropdown.value) return;
  onSearch();
}

const onSearch = async () => {
  showDropdown.value = true
  loading.value = true
  try {
    debouncedSearch();
  } finally {
    loading.value = false;
  }
}

const selectOption = (item: T) => {
  emit('update:modelValue', item);
  search.value = props.labelKey(item);
  showDropdown.value = false;
}
</script>

<style scoped>

.selector-wrapper {
  display: flex;
  position: relative;
}

.selector-wrapper>input {
  width: 100%;
}

.selector-wrapper.opened {
  box-shadow: var(--box-shadow);
}

.selector-input {
  min-height: var(--input-height);
  box-sizing: border-box;
  width: 100%;
  padding: 0.4rem 0.6rem;
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--color-border);
  font-size: var(--font-size-md);
  background-color: var(--color-panel-bg);
  color: var(--color-text);
  transition: border-color var(--transition-base), box-shadow var(--transition-base), background-color var(--transition-base), color var(--transition-base);
}

.selector-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--box-shadow);
}

.selector-input.opened {
  border-radius: var(--border-radius-sm) var(--border-radius-sm) 0 0;
}

.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--color-panel-bg);
  border: 1px solid var(--color-border);
  border-top: none;
  border-radius: 0 0 var(--border-radius-sm) var(--border-radius-sm);
  margin-top: 0;
  list-style: none;
  padding: 0;
  max-height: 200px;
  overflow-y: auto;
  z-index: var(--z-index-dropdown);
  transition: background var(--transition-base), border-color var(--transition-base);
}

.dropdown li {
  display: flex;
  align-items: center;
  min-height: var(--input-height);
  padding: 0.4rem 0.6rem;
  box-sizing: border-box;
  cursor: pointer;
  color: var(--color-text);
  transition: color var(--transition-base), background var(--transition-base);
}

.dropdown li:hover {
  background: var(--color-hover-bg);
}

.loading,
.no-results {
  padding: 0.4rem 0.6rem;
  color: var(--color-text-dimmed);
  font-style: italic;
  transition: color var(--transition-base);
}
</style>
