<template>
  <div class="logs-page">
    <BaseSelector v-model="selectedApp" label="Application:" id="appSelect" :fetch-options="fetchApps" />

    <div class="filters">
      <BaseInput v-model="filters.message" type="text" placeholder="Message contains..." />
      <multiselect v-model="filters.logLevel" :options="Object.values(LogLevel)" :multiple="true"
        :placeholder="'Log level'" class="log-level-select" />
      <BaseInput v-model="filters.platform" type="text" placeholder="Platform" />
      <BaseInput v-model="filters.bundleId" type="text" placeholder="Bundle ID" />
      <BaseInput v-model="filters.deviceId" type="text" placeholder="Device ID" />
      <label>
        From:
        <BaseInput v-model="filters.from" type="datetime-local" />
      </label>
      <label>
        To:
        <BaseInput v-model="filters.to" type="datetime-local" />
      </label>
      <BaseButton @click="applyFilters" class="primary">Apply</BaseButton>
      <BaseButton @click="resetFilters">Reset</BaseButton>
    </div>

    <div class="logs-list" @scroll="handleScroll">
      <h2>Logs for: {{ selectedApp || 'All' }}</h2>
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
            <div v-if="log.receiveTimestamp" class="detail"><strong>Received:</strong> {{
              formatDate(log.receiveTimestamp) }}</div>
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
import { events, type EventMessage, type EventFilter, LogLevel } from '@/api/events';
import BaseSelector from '@/components/base/BaseSelector.vue';
import TagBadge from '@/components/base/TagBadge.vue';
import LogLevelBadge from '@/components/base/LogLevelBadge.vue';
import Multiselect from 'vue-multiselect';
import { ref, computed, onMounted } from 'vue';
import BaseButton from './base/BaseButton.vue';
import BaseInput from './base/BaseInput.vue';

const selectedApp = ref<string>('');
const logs = ref<EventMessage[]>([]);
const filters = ref<{
  message: string;
  logLevel: LogLevel[] | null;
  platform: string;
  bundleId: string;
  deviceId: string;
  from: string | null;
  to: string | null;
}>({
  message: '',
  logLevel: null,
  platform: '',
  bundleId: '',
  deviceId: '',
  from: null,
  to: null,
});
const pageSize = 100;
let offset = 0;
let isLoading = false;
let hasMore = true;


const filteredLogs = computed(() => logs.value);

onMounted(() => {
  fetchLogs(true);
});



function handleScroll(event: Event) {
  const target = event.target as HTMLDivElement;
  const { scrollTop, clientHeight, scrollHeight } = target;
  if (scrollTop + clientHeight >= scrollHeight - 50 && !isLoading && hasMore) {
    fetchLogs();
  }
}

async function fetchLogs(clear: boolean = false) {
  isLoading = true;
  if (clear) {
    offset = 0;
    hasMore = true;
  }
  const filter: EventFilter = {
    message: filters.value.message || null,
    logLevel: filters.value.logLevel ? filters.value.logLevel : null,
    platform: filters.value.platform || null,
    bundleId: filters.value.bundleId || null,
    deviceId: filters.value.deviceId || null,
    from: filters.value.from ? new Date(filters.value.from) : null,
    to: filters.value.to ? new Date(filters.value.to) : null,
  };

  const eventsResult = await events.search(pageSize, offset, filter);
  if (eventsResult.isRight()) {
    const events = eventsResult.value.result.events.map(e => ({
      ...e,
      meta: e.meta instanceof Map ? e.meta : new Map<string, string>(Object.entries(e.meta || {})),
    }));
    if (clear) {
      logs.value = events;
    } else {
      logs.value = [...logs.value, ...events];
    }
    hasMore = events.length == pageSize;
    offset += events.length;
  }

  isLoading = false;
}

function applyFilters() {
  fetchLogs(true);
}

function resetFilters() {
  filters.value = {
    message: '',
    logLevel: null,
    platform: '',
    bundleId: '',
    deviceId: '',
    from: null,
    to: null,
  };
  fetchLogs(true);
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

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
<style scoped>
.logs-page {
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  font-family: sans-serif;
}

.logs-list {

  overflow-y: auto;
  overflow-x: hidden;
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
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
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

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.log-level-select {
  height: 27px;
  width: 200px;
}

</style>
