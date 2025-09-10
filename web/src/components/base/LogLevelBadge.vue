<template>
  <span :class="['log-level-badge', levelClass]">{{ level }}</span>
</template>

<script setup lang="ts">
import type { LogLevel } from '@/api/events';
import { computed } from 'vue';

const props = defineProps<{
  level: LogLevel
}>();

const levelClass = computed(() => props.level.toLowerCase());
</script>

<style scoped>
.log-level-badge {
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  font-weight: bold;
  text-transform: uppercase;
  font-size: 0.75rem;
  color: #fff;
  display: inline-block;
}

.log-level-badge.info {
  background: #3b82f6;
}

.log-level-badge.warn {
  background: #f59e0b;
}

.log-level-badge.error {
  background: #ef4444;
}

.log-level-badge.debug {
  background: #6b7280;
}
</style>
