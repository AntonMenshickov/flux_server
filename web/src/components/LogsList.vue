<template>
  <div class="logs-page">
    <BaseSelector v-model="selectedApp" label="Application:" id="appSelect" :fetch-options="fetchApps" />
    <div class="logs-list">
      <h2>Logs for: {{ selectedApp }}</h2>
      <ul>
        <li v-for="(log, index) in filteredLogs" :key="index">
          <span class="timestamp">{{ log.timestamp }}</span>
          <span class="message">{{ log.message }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { applications } from '@/api/applications';
import BaseSelector from '@/components/base/BaseSelector.vue';
import { ref, computed } from 'vue'


const apps = ['App A', 'App B', 'App C']


const selectedApp = ref<string>('')


const logs = ref([
  { app: 'App A', timestamp: '2025-09-08 12:01', message: 'App A запустился' },
  { app: 'App A', timestamp: '2025-09-08 12:02', message: 'Получены данные' },
  { app: 'App B', timestamp: '2025-09-08 12:03', message: 'Ошибка соединения' },
  { app: 'App C', timestamp: '2025-09-08 12:04', message: 'App C завершил работу' },
])

const filteredLogs = computed(() =>
  logs.value.filter((l) => l.app === selectedApp.value)
)

async function fetchApps(search: string): Promise<{ label: string, value: string }[]> {
  const searchResult = await applications.search(search, 10, 0);
  if (searchResult.isRight()) {
    return searchResult.value.result.applications.map(a => ({ label: a.name, value: a.id }));
  }
  return [];
}
</script>

<style scoped>
.logs-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  font-family: sans-serif;
}

.logs-list {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
  background: #fafafa;
}

.logs-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.logs-list li {
  padding: 0.3rem 0;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  gap: 1rem;
}

.timestamp {
  color: #888;
  font-size: 0.85rem;
  min-width: 140px;
}

.message {
  flex: 1;
}
</style>
