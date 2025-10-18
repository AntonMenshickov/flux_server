<template>
  <span :class="['log-level-badge', levelClass]">{{ level }}</span>
</template>

<script setup lang="ts">
import type { LogLevel } from '@/model/event/logLevel';
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
  background: var(--log-info);
}

.log-level-badge.warn {
  background: var(--log-warn);
}

.log-level-badge.error {
  background: var(--log-error);
}
.log-level-badge.crash {
  background: var(--log-crash);
}

.log-level-badge.debug {
  background: var(--log-debug);
}
</style>
