<template>
  <div class="loader-container" :style="{ minHeight: minHeight + 'px' }">
    <div class="loader" :style="{ width: size + 'px', height: size + 'px', borderWidth: borderWidth + 'px' }"></div>
    <p class="loader-text" v-if="text">{{ text }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  text?: string;
  size?: number;
  minHeight?: number;
  borderWidth?: number;
}

withDefaults(defineProps<Props>(), {
  text: 'Loading...',
  size: 48,
  minHeight: 400,
  borderWidth: 4
});
</script>

<style scoped>
.loader-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
}

.loader {
  border: 4px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loader-text {
  font-size: 1rem;
  color: var(--color-text-dimmed);
  margin: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

