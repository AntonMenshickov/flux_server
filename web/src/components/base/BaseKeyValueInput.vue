<template>
  <div class="dropdown-wrapper" ref="dropdown">
    <BaseInput v-model="presentation" :placeholder="placeholder" readonly @click="openDropdown"
      @keydown.enter.prevent="onEnter"></BaseInput>

    <div v-if="showDropdown" class="dropdown">
      <BaseKeyValueEditor v-model="localValue" @submit="onEnter" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import BaseInput from './BaseInput.vue';
import BaseKeyValueEditor from './BaseKeyValueEditor.vue';

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

const emit = defineEmits(['update:modelValue', 'submit']);


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

const onEnter = async () => {
  showDropdown.value = false;
  emit('submit', localValue.value)
};

</script>

<style scoped>
.dropdown-wrapper {
  position: relative;
}

.dropdown-wrapper>input {
  width: 100%;
}

.dropdown {
  position: absolute;
  top: 100%;
  width: auto;
  border-radius: 8px;
  margin-top: 0.1rem;
  border: 1px solid var(--color-border);
  background-color: white;
  box-shadow: var(--box-shadow-strong);
  z-index: 1000;
}
</style>
