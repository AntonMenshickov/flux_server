<template>
  <div class="logs-page">
    <div class="filters">
      <!-- <SmartSearch :options="fieldOptions" @update:criteria="onCriteriaUpdate" /> -->
      <BaseSelector v-model="application" :fetch-options="fetchApps" :label-key="(u) => u.name" :value-key="(u) => u.id"
        placeholder="Select application" />
      <BaseInput v-model="filters.message" type="text" placeholder="Message contains..." />
      <BaseMultiselect v-model="filters.logLevel" :options="Object.values(LogLevel)"
        :label-builder="logLevelLabelBuilder" label="Log level" />
      <BaseInput v-model="filters.platform" type="text" placeholder="Platform" />
      <BaseInput v-model="tagsValue" type="text" placeholder="Tags (delimiter ',')" />
      <BaseInput v-model="filters.bundleId" type="text" placeholder="Bundle ID" />
      <BaseInput v-model="filters.deviceId" type="text" placeholder="Device ID" />
      <BaseInput v-model="filters.deviceName" type="text" placeholder="Device Name" />
      <BaseInput v-model="filters.osName" type="text" placeholder="Operating system name" />
      <BaseKeyValueInput v-model="filters.meta" placeholder="meta" />
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
      <LogCard v-for="(log, index) in filteredLogs" :key="index" :log="log" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { applications } from '@/api/applications';
import { events } from '@/api/events';
import BaseSelector from '@/components/base/BaseSelector.vue';
import { ref, computed, onMounted } from 'vue';
import BaseButton from './base/BaseButton.vue';
import BaseInput from './base/BaseInput.vue';
import BaseMultiselect from './base/BaseMultiselect.vue';
import type { EventMessage } from '@/model/event/eventMessage';
import { LogLevel } from '@/model/event/logLevel';
import type { EventFilter } from '@/model/event/eventFilter';
import type { Application } from '@/model/application/application';
import LogCard from './base/LogCard.vue';
// import SmartSearch from './base/smartSearch/SmartSearch.vue';
// import { Operator, SearchCriterion, type FieldOption } from './base/smartSearch/types';
import BaseKeyValueInput from './base/BaseKeyValueInput.vue';


// const fieldOptions: FieldOption[] = [
//   {
//     key: 'dateFrom',
//     operators: [Operator.Equals],
//     valueType: 'date',
//   },
//   {
//     key: 'dateTo',
//     operators: [Operator.Equals],
//     valueType: 'date',
//   },
//   {
//     key: 'meta',
//     operators: [Operator.Equals, Operator.NotEquals],
//     valueType: 'keyValue',
//   },
//   {
//     key: 'message',
//     operators: [Operator.Equals, Operator.NotEquals, Operator.Similar],
//     valueType: 'string',
//     fetchValues: async (filter = '') => {
//       const all = ['USA', 'Russia', 'Japan', 'Germany'];
//       return all.filter(v => v.toLowerCase().includes(filter.toLowerCase()));
//     }
//   }
// ];

// const criteria: SearchCriterion[] = [];

// const onCriteriaUpdate = (arr: SearchCriterion[]) => {
//   // тут получаем массив экземпляров SearchCriterion
//   // (в компоненте они добавляются как new SearchCriterion(...))
//   // можно глубоко копировать, если нужно
//   criteria.splice(0, criteria.length, ...arr);
// };

const logs = ref<EventMessage[]>([]);
const filters = ref<{
  application: Application | null,
  message: string | null;
  logLevel: LogLevel[] | null;
  tags: string[] | null;
  meta: { key: string, value: string }[] | null,
  platform: string;
  bundleId: string;
  deviceId: string;
  deviceName: string;
  osName: string;
  from: string | null;
  to: string | null;
}>({
  application: null,
  message: '',
  logLevel: null,
  tags: null,
  meta: null,
  platform: '',
  bundleId: '',
  deviceId: '',
  deviceName: '',
  osName: '',
  from: null,
  to: null,
});
const application = ref<Application | null>(null);
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

  if (!application.value) {
    return;
  }

  const filter: EventFilter = {
    message: filters.value.message || null,
    logLevel: filters.value.logLevel ? filters.value.logLevel : null,
    tags: filters.value.tags || null,
    meta: filters.value.meta ? Object.fromEntries(filters.value.meta
      .filter(({ key, value }) => key.trim().length > 0 && value.trim().length > 0)
      .map(({ key, value }) => [key, value])) : null,
    platform: filters.value.platform || null,
    bundleId: filters.value.bundleId || null,
    deviceId: filters.value.deviceId || null,
    deviceName: filters.value.deviceName || null,
    osName: filters.value.osName || null,
    from: filters.value.from ? new Date(filters.value.from).getTime() * 1000 : null,
    to: filters.value.to ? new Date(filters.value.to).getTime() * 1000 : null,
  };

  const eventsResult = await events.search(pageSize, offset, application.value.id, filter);
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
  } else {
    alert(eventsResult.value.message);
  }

  isLoading = false;
}

function applyFilters() {
  fetchLogs(true);
}

function resetFilters() {
  filters.value = {
    application: null,
    message: '',
    logLevel: null,
    tags: null,
    meta: null,
    platform: '',
    bundleId: '',
    deviceId: '',
    deviceName: '',
    osName: '',
    from: null,
    to: null,
  };
  fetchLogs(true);
}

async function fetchApps(search: string): Promise<Application[]> {
  const searchResult = await applications.search(search, 10, 0);
  if (searchResult.isRight()) {
    return searchResult.value.result.applications;
  }
  return [];
}

</script>

<style scoped>
.logs-page {
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  font-family: sans-serif;
}

.logs-list {
  padding: 1.5rem;
  overflow-y: auto;
  overflow-x: hidden;
}

.filters {
  display: flex;
  flex-direction: row;
  padding: 1.5rem;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: start;
}

.filter-actions {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
}
</style>
