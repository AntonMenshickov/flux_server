<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal">
      <slot></slot>
      <div class="modal-buttons">
        <BaseButton v-if="cancelText" class="cancel" @click="onCancel">{{ cancelText }}</BaseButton>
        <BaseButton v-if="confirmText" :class="{ 'danger': isDanger, 'primary': !isDanger, 'confirm': true }" @click="onConfirm">{{
          confirmText
        }}</BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue';

defineProps<{
  show: boolean,
  cancelText: string | null,
  confirmText: string | null,
  isDanger: boolean,
}>()

const emit = defineEmits(['cancel', 'confirm'])

function onCancel() {
  emit('cancel');
}

function onConfirm() {
  emit('confirm');
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}

.modal {
  display: flex;
  flex-direction: column;
  background-color: var(--color-secondary);
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
  min-width: 300px;
}

.modal-buttons {
  margin-top: 1rem;
  display: flex;
  justify-content: space-around;
}

</style>
