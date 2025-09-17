<template>
  <div class="dropdown-wrapper" ref="dropdown">
    <BaseInput v-model="presentation" :placeholder="placeholder" readonly @click="openDropdown"></BaseInput>
    <div v-if="showDropdown" class="key-value-editor">
      <div v-for="(item, index) in localValue" :key="index" class="item">
        <BaseInput v-model="item.key" placeholder="Key" class="input-key" @input="updateItem" />
        <BaseInput v-model="item.value" placeholder="Value" class="input-value" @input="updateItem" />
        <BaseButton @click="removeItem(index)" class="remove-button">
          <TrashIcon />
        </BaseButton>
      </div>

      <BaseButton @click="addItem" class="add-button">
        <PlusIcon />Add key-value pair
      </BaseButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { TrashIcon, PlusIcon } from '@heroicons/vue/24/outline';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import BaseInput from './BaseInput.vue';
import BaseButton from './BaseButton.vue';

interface KeyValue {
  key: string;
  value: string;
}

const props = defineProps<{
  modelValue: KeyValue[] | null
  placeholder?: string | null
}>();

const dropdown = ref<HTMLElement | null>(null);
const showDropdown = ref<boolean>(false);

const emit = defineEmits(['update:modelValue']);


const localValue = computed<KeyValue[]>({
  get: () => props.modelValue ?? [],
  set: (val: KeyValue[]) => emit('update:modelValue', val),
});

const presentation = computed<string>(() => (props.modelValue ?? [])
  .filter(e => e.key.trim().length > 0 && e.value.trim().length > 0)
  .map(e => `[${e.key}: ${e.value}]`).join(', '),
);

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

function openDropdown() {
  showDropdown.value = true;
}

function addItem() {
  localValue.value = [...localValue.value, { key: '', value: '' }];
}

function removeItem(index: number) {
  const newValue = [...localValue.value];
  newValue.splice(index, 1);
  localValue.value = newValue
}

function updateItem() {
  emit('update:modelValue', localValue.value)
}

</script>

<style scoped>
.dropdown-wrapper {
  position: relative;
}

.dropdown-wrapper>input {
  width: 100%;
}

.key-value-editor {
  position: absolute;
  top: 100%;
  width: auto;
  padding: 0.5rem 0.8rem;
  border-radius: 8px;
  margin-top: 0.1rem;
  border: 1px solid var(--color-border);
  background-color: white;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: var(--box-shadow-strong);
}

.item {
  display: flex;
  gap: 10px;
  align-items: center;
}

.item .remove-button svg {
  width: 1rem;
  height: 1rem;
  color: var(--color-secondary);
}

.add-button {
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: center;
  justify-content: center;
}

.add-button svg {
  width: 1.1rem;
  height: 1.1rem;
  color: var(--color-secondary);
}
</style>
