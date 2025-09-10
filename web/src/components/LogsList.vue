<template>
  <div class="logs-page">
    <BaseSelector
      v-model="selectedApp"
      label="Application:"
      id="appSelect"
      :fetch-options="fetchApps"
    />
    <div class="logs-list">
      <h2>Logs for: {{ selectedApp }}</h2>
      <ul>
        <li v-for="(log, index) in filteredLogs" :key="index" class="log-card">
          <header class="log-header">
            <div class="timestamp">{{ formatDate(log.timestamp) }}</div>
            <LogLevelBadge :level="log.logLevel" />
          </header>

          <section class="log-main">
            <h3 class="log-message">{{ log.message }}</h3>
            <div v-if="log.stackTrace" class="stacktrace">
              <strong>Stack Trace:</strong>
              <pre>{{ log.stackTrace }}</pre>
            </div>
          </section>

          <section class="log-details">
            <div class="detail"><strong>App ID:</strong> {{ log.applicationId }}</div>
            <div class="detail"><strong>Platform:</strong> {{ log.platform }}</div>
            <div class="detail"><strong>Bundle:</strong> {{ log.bundleId }}</div>
            <div class="detail"><strong>Device:</strong> {{ log.deviceId }}</div>
            <div v-if="log.receiveTimestamp" class="detail"><strong>Received:</strong> {{ formatDate(log.receiveTimestamp) }}</div>
          </section>

          <section class="tags-meta">
            <div class="tags">
              <strong>Tags:</strong>
              <TagBadge v-for="tag in log.tags" :key="tag" :label="tag" />
            </div>
            <div class="meta">
              <strong>Meta:</strong>
              <ul>
                <li v-for="[key, value] in log.meta" :key="key">{{ key }}: {{ value }}</li>
              </ul>
            </div>
          </section>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { applications } from '@/api/applications';
import { events, type EventMessage } from '@/api/events';
import BaseSelector from '@/components/base/BaseSelector.vue';
import TagBadge from '@/components/base/TagBadge.vue';
import LogLevelBadge from '@/components/base/LogLevelBadge.vue';
import { ref, computed, onMounted } from 'vue';

const selectedApp = ref<string>('');
const logs = ref<EventMessage[]>([]);

const filteredLogs = computed(() => logs.value);

onMounted(() => {
  fetchLogs();
});

async function fetchLogs() {
  const eventsResult = await events.search(500, 0);
  if (eventsResult.isRight()) {
    logs.value.push(...eventsResult.value.result.events.map(e => ({
      ...e,
      meta: e.meta instanceof Map ? e.meta : new Map<string, string>(Object.entries(e.meta || {})),
    })));
  }
}

async function fetchApps(search: string): Promise<{ label: string; value: string }[]> {
  const searchResult = await applications.search(search, 10, 0);
  if (searchResult.isRight()) {
    return searchResult.value.result.applications.map((a) => ({
      label: a.name,
      value: a.id,
    }));
  }
  return [];
}

function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString();
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

.logs-list h2 {
  margin-bottom: 1rem;
}

.logs-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.log-card {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timestamp {
  font-size: 0.9rem;
  color: #666;
}

.log-main .log-message {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0;
}

.stacktrace {
  background: #f9f9f9;
  border-left: 3px solid #ccc;
  padding: 0.5rem;
  border-radius: 4px;
}
.stacktrace pre {
  margin: 0.2rem 0 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 0.85rem;
}

.log-details {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.4rem 1rem;
  font-size: 0.9rem;
  color: #444;
}

.tags-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.meta {
  font-size: 0.85rem;
}

.meta ul {
  padding-left: 1rem;
  margin: 0.3rem 0 0;
}
</style>
