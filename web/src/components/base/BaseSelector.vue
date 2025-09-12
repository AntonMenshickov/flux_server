<template>
  <div class="base-selector">
    <label v-if="label" :for="id" class="selector-label">{{ label }}</label>

    <div :class="{ 'selector-wrapper': true, 'opened': showDropdown }">
      <input :id="id" v-model="search" type="text" :class="{ 'selector-input': true, 'opened': showDropdown }"
        placeholder="Type for search..." @input="onSearch" />

      <ul v-if="showDropdown" class="dropdown">
        <li v-for="option in options" :key="option.value" @click="selectOption(option)">
          {{ option.label }}
        </li>
        <li v-if="loading" class="loading">loading...</li>
        <li v-if="!loading && options.length === 0" class="no-results">No results</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { debounce } from 'lodash';
import { ref, watch } from 'vue'


type Option = { label: string; value: string }



const props = defineProps<{
  modelValue?: string
  fetchOptions: (query: string) => Promise<Option[]>
  label?: string
  id?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const search = ref('')
const options = ref<Option[]>([])
const loading = ref(false)
const showDropdown = ref(false)

const debouncedSearch = debounce(fetchData, 200);



watch(
  () => props.modelValue,
  (val) => {
    const found = options.value.find((o) => o.value === val)
    if (found) search.value = found.label
  },
  { immediate: true }
)

async function fetchData() {
  options.value = await props.fetchOptions(search.value.trim());
}


const onSearch = async () => {
  showDropdown.value = true
  loading.value = true
  try {
    debouncedSearch();
  } finally {
    loading.value = false
  }
}


const selectOption = (option: Option) => {
  emit('update:modelValue', option.value)
  search.value = option.label
  showDropdown.value = false
}
</script>

<style scoped>
.base-selector {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  position: relative;
  width: 250px;
}

.selector-wrapper {
  display: flex;
  position: relative;
}

.selector-wrapper.opened {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.selector-input {
  min-height: 40px;
  box-sizing: border-box;
  width: 100%;
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 0.95rem;
}

.selector-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(100, 150, 250, 0.2);
}

.selector-input.opened {
  border-radius: 6px 6px 0 0;
}

.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid var(--color-border);
  border-top: none;
  border-radius: 0 0 6px 6px;
  margin-top: 0;
  list-style: none;
  padding: 0;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
}

.dropdown li {
  padding: 0.4rem 0.6rem;
  cursor: pointer;
}

.dropdown li:hover {
  background: #f0f0f0;
}

.loading,
.no-results {
  padding: 0.4rem 0.6rem;
  color: #888;
  font-style: italic;
}
</style>
