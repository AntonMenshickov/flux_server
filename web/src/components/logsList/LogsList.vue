<template>
  <div class="logs-page">
    <div v-if="application == null" class="apps">
      <AppCard v-for="(app, index) in appsData" :key="index" @click="selectApp(app)" :appStats="app" />
    </div>
    <div v-if="application != null" class="apps">
      <AppCard :appName="application.name" :appStats="application" />
      <div>Additional application stats</div>
    </div>
    <div v-if="application != null" class="smart-search">
      <SmartSearch :options="fieldOptions" v-model="criteria" @update:modelValue="applyFilters"
        class="smart-search-field" />
    </div>
    <div v-if="application != null" class="logs-list" @scroll="handleScroll">
      <LogCard v-for="(log, index) in filteredLogs" :key="index" :log="log" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { applications } from '@/api/applications';
import { events } from '@/api/events';
import { ref, computed, onMounted } from 'vue';
import type { EventMessage } from '@/model/event/eventMessage';
import { LogLevel } from '@/model/event/logLevel';
import LogCard from '@/components/base/LogCard.vue';
import SmartSearch from '@/components/base/smartSearch/SmartSearch.vue';
import { Operator, SearchCriterion, ValueType, type FieldOption } from '../base/smartSearch/types';
import AppCard from './AppCard.vue';
import type { ApplicationStats } from '@/model/application/applicationStats';


const fieldOptions: FieldOption[] = [
  {
    key: 'dateFrom',
    operators: [Operator.Equals],
    valueType: ValueType.Date,
    placeholder: 'From date',
  },
  {
    key: 'dateTo',
    operators: [Operator.Equals],
    valueType: ValueType.Date,
    placeholder: 'To date',
  },
  {
    key: 'meta',
    operators: [Operator.Equals, Operator.NotEquals, Operator.Similar],
    valueType: ValueType.KeyValue,
    placeholder: 'Meta key-value',
  },
  {
    key: 'message',
    operators: [Operator.Equals, Operator.NotEquals, Operator.Similar],
    valueType: ValueType.String,
    placeholder: 'Log message',
  },
  {
    key: 'logLevel',
    operators: [Operator.In, Operator.NotIn],
    valueType: ValueType.MultiSelect,
    fetchValues: async (filter = '') => {
      return Object.values(LogLevel).filter(l => l.toString().toLowerCase().includes(filter.toLowerCase())).map(l => l.toString());
    },
    placeholder: 'Select log levels',
  },
  {
    key: 'tags',
    operators: [Operator.Equals, Operator.In, Operator.NotIn],
    valueType: ValueType.String,
    placeholder: 'Comma separated tags',
  },
  {
    key: 'platform',
    operators: [Operator.Equals, Operator.Similar],
    valueType: ValueType.String,
    placeholder: 'Platform name',
  },
  {
    key: 'bundleId',
    operators: [Operator.Equals, Operator.Similar],
    valueType: ValueType.String,
    placeholder: 'Bundle ID',
  },
  {
    key: 'deviceId',
    operators: [Operator.Equals, Operator.Similar],
    valueType: ValueType.String,
    placeholder: 'Device ID',
  },
  {
    key: 'deviceName',
    operators: [Operator.Equals, Operator.Similar],
    valueType: ValueType.String,
    placeholder: 'Device Name',
  },
  {
    key: 'osName',
    operators: [Operator.Equals, Operator.Similar],
    valueType: ValueType.String,
    placeholder: 'Operating System Name',
  },
];

const appsData = ref<ApplicationStats[]>([]);
const logs = ref<EventMessage[]>([]);
const application = ref<ApplicationStats | null>(null);
const criteria = ref<SearchCriterion[]>([]);
const pageSize = 100;
let offset = 0;
let isLoading = false;
let hasMore = true;


const filteredLogs = computed(() => logs.value);

onMounted(async () => {
  fetchLogs(true);
  appsData.value = await fetchApps('');
});


function handleScroll(event: Event) {
  const target = event.target as HTMLDivElement;
  const { scrollTop, clientHeight, scrollHeight } = target;
  if (scrollTop + clientHeight >= scrollHeight - 50 && !isLoading && hasMore) {
    fetchLogs();
  }
}

function selectApp(app: ApplicationStats) {
  application.value = app;
  applyFilters();
}

function applyFilters() {
  fetchLogs(true);
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

  const eventsResult = await events.search(pageSize, offset, application.value.id, criteria.value);
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

async function fetchApps(search: string): Promise<ApplicationStats[]> {
  const searchResult = await applications.searchStats(search, 10, 0);
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
  padding-top: 1rem;
  overflow-y: auto;
  overflow-x: hidden;
}

.smart-search {
  display: flex;
  flex-direction: row;
  align-items: start;
  gap: 1rem;
  margin: 1.5rem;
  margin-bottom: 0;
  margin-top: 1rem;
}

.smart-search .smart-search-field {
  flex: 1;
}

.apps {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin: 1.5rem;
  margin-bottom: 0;
}
</style>
