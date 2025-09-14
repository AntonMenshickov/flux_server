<template>
  <div class="logs-page">
    <div class="filters">
      <BaseSelector v-model="filters.applicationId" placeholder="Application" :fetch-options="fetchApps" />
      <BaseInput v-model="filters.message" type="text" placeholder="Message contains..." />
      <BaseMultiselect v-model="filters.logLevel" :options="Object.values(LogLevel)"
        :label-builder="logLevelLabelBuilder" label="Log level" />
      <BaseInput v-model="filters.platform" type="text" placeholder="Platform" />
      <BaseInput v-model="tagsValue" type="text" placeholder="Tags delimiter ','" />
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
      <div class="filter-actions">
        <BaseButton @click="applyFilters" class="primary">Apply</BaseButton>
        <BaseButton @click="resetFilters">Reset</BaseButton>
      </div>
    </div>

    <div class="logs-list" @scroll="handleScroll">
      <h2>Logs for: {{ filters.applicationId || 'All' }}</h2>
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
import { ref, computed, onMounted } from 'vue';
import BaseButton from './base/BaseButton.vue';
import BaseInput from './base/BaseInput.vue';
import BaseMultiselect from './base/BaseMultiselect.vue';


const logs = ref<EventMessage[]>([]);
const filters = ref<{
  applicationId: string | null,
  message: string | null;
  logLevel: LogLevel[] | null;
  tags: string[] | null;
  platform: string;
  bundleId: string;
  deviceId: string;
  from: string | null;
  to: string | null;
}>({
  applicationId: '',
  message: '',
  logLevel: null,
  tags: null,
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

const tagsValue = computed({
  get: () => filters.value.tags?.join(', '),
  set: (val: string) => filters.value.tags = val.split(',').map(e => e.trim()).filter(e => e.length > 0),
})

onMounted(() => {
  fetchLogs(true);
});

function logLevelLabelBuilder(logLevel: LogLevel): string {
  return logLevel.toString();
}


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
    applicationId: filters.value.applicationId || null,
    message: filters.value.message || null,
    logLevel: filters.value.logLevel ? filters.value.logLevel : null,
    tags: filters.value.tags || null,
    platform: filters.value.platform || null,
    bundleId: filters.value.bundleId || null,
    deviceId: filters.value.deviceId || null,
    from: filters.value.from ? new Date(filters.value.from).getTime() * 1000 : null,
    to: filters.value.to ? new Date(filters.value.to).getTime() * 1000 : null,
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
    applicationId: '',
    message: '',
    logLevel: null,
    tags: null,
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

function formatDate(dateStr: string) {
  const cleanStr = dateStr.replace(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\.(\d{3})\d+$/, "$1.$2");

  const isoStr = cleanStr.replace(" ", "T") + "Z";
  return new Date(isoStr).toLocaleString();
}
</script>

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

.filter-actions {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
}
</style>
