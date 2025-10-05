<template>
  <div class="logs-page">
    <div class="smart-search">
      <BaseSelector v-model="application" :fetch-options="fetchApps" :label-key="(u) => u.name" :value-key="(u) => u.id"
        placeholder="Select application" />
      <SmartSearch :options="fieldOptions" @update:criteria="onCriteriaUpdate" class="smart-search-field" />
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
import type { EventMessage } from '@/model/event/eventMessage';
import { LogLevel } from '@/model/event/logLevel';
import type { Application } from '@/model/application/application';
import LogCard from './base/LogCard.vue';
import SmartSearch from './base/smartSearch/SmartSearch.vue';
import { Operator, SearchCriterion, ValueType, type FieldOption } from './base/smartSearch/types';


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

const criteria: SearchCriterion[] = [];

const onCriteriaUpdate = (arr: SearchCriterion[]) => {
  criteria.splice(0, criteria.length, ...arr);
};

const logs = ref<EventMessage[]>([]);
const application = ref<Application | null>(null);
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

  if (!application.value) {
    return;
  }

  const eventsResult = await events.search(pageSize, offset, application.value.id, criteria);
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
  criteria.splice(0, criteria.length);
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

.filter-actions {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
}

.smart-search {
  display: flex;
  flex-direction: row;
  align-items: start;
  gap: 1rem;
  padding: 1.5rem;
}

.smart-search .smart-search-field {
  flex: 1;
}

</style>
