<template>
  <div class="key-value-editor">
    <div v-for="(item, index) in localValue" :key="index" class="item">
      <BaseInput v-model="item.key" placeholder="Key" class="input-key" @input="updateItem"
        @keydown.enter.prevent="onEnter" />
      <BaseInput v-model="item.value" placeholder="Value" class="input-value" @input="updateItem"
        @keydown.enter.prevent="onEnter" />
      <BaseButton @click="removeItem(index)" class="remove-button">
        <TrashIcon />
      </BaseButton>
    </div>

    <BaseButton @click="addItem" class="add-button">
      <PlusIcon />Add key-value pair
    </BaseButton>
  </div>
</template>

<script lang="ts" setup>
import { TrashIcon, PlusIcon } from '@heroicons/vue/24/outline';
import { computed } from 'vue';
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

const emit = defineEmits(['update:modelValue', 'submit']);


const localValue = computed<KeyValue[]>({
  get: () => props.modelValue ?? [],
  set: (val: KeyValue[]) => emit('update:modelValue', val),
});


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

const onEnter = async () => {
  emit('submit', localValue.value)
};

</script>

<style scoped>

.key-value-editor {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0.5rem 0.8rem;
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
