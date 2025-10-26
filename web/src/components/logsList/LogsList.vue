<template>
  <div class="logs-page" @scroll="handleScroll">
    <div v-if="application != null" class="logs-page-header">
      <ArrowLeftIcon @click="backToApps" class="go-to-apps" />
      <div class="app-name">{{ application.name }}</div>
      <OnlineDevices :applicationId="application?.id" @update:select="deviceSelected" />
    </div>
    <div v-if="application == null" class="apps">
      <AppCard v-for="(app, index) in appsData" :key="index" @click="selectApp(app)" :appStats="app" />
    </div>
    <div v-if="application != null" class="stats-wrapper">
      <AppStatsChart :application="application" @search="addLogLevelCriterion" />
    </div>
    <div v-if="application != null" class="smart-search">
      <SmartSearch :options="fieldOptions" v-model="criteria" @update:modelValue="applyFilters"
        class="smart-search-field" />
      <VueDatePicker v-model="dateTimeFilter" @update:model-value="applyFilters" @cleared="applyFilters" range :multiCalendars="{ solo: true }" class="date-picker">
        <template #dp-input="{ value }">
          <BaseInput v-show="value.length" :value="value"  type="text" placeholder="Date and time filter" class="date-time-input"/>
          <BaseButton v-show="!value.length" class="primary" title="Set date time filter">
            <CalendarDateRangeIcon class="search-action-button" />
          </BaseButton>
        </template>
      </VueDatePicker>
      <BaseButton @click="fetchLogs(true)" title="reload">
        <ArrowPathIcon class="search-action-button" />
      </BaseButton>
    </div>
    <div v-if="application != null" class="logs-list">
      <LogCard v-for="(log) in logs" :key="log.id" :log="log" @search="addSearchCriterion" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { applications, type ApplicationStatsResponse, type ConnectedDevice } from '@/api/applications';
import { events } from '@/api/events';
import { ref, onMounted, watch } from 'vue';
import type { EventMessage } from '@/model/event/eventMessage';
import LogCard from '@/components/base/LogCard.vue';
import SmartSearch from '@/components/base/smartSearch/SmartSearch.vue';
import { Operator, SearchCriterion, SearchFieldKey } from '@/components/base/smartSearch/types';
import AppCard from './AppCard.vue';
import type { ApplicationShortStats } from '@/model/application/applicationShortStats';
import AppStatsChart from '@/components/logsList/AppStatsChart.vue';
import { ArrowLeftIcon, ArrowPathIcon, CalendarDateRangeIcon } from '@heroicons/vue/24/outline';
import OnlineDevices from '@/components/logsList/OnlineDevices.vue';
import { fieldOptions } from '@/components/base/smartSearch/searchCriterions';
import router from '@/router';
import { useRoute } from 'vue-router';
import type { LogLevel } from '@/model/event/logLevel';
import BaseButton from '../base/BaseButton.vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import BaseInput from '../base/BaseInput.vue';


const appsData = ref<ApplicationShortStats[]>([]);
const logs = ref<EventMessage[]>([]);
const application = ref<ApplicationStatsResponse | null>(null);
const dateTimeFilter = ref<Date[]>([]);
const criteria = ref<SearchCriterion[]>([]);
const pageSize = 100;
let lastTimestamp: number | undefined = undefined;
let lastId: string | undefined = undefined;
let isLoading = false;
let hasMore = true;

const route = useRoute();

onMounted(async () => {
  const appId = route.params.applicationId?.toString();
  if (appId) {
    onAppIdChanged(appId);
  } else {
    appsData.value = await fetchApps('');
  }
});

watch<string>(
  () => route.params.applicationId?.toString(),
  async (newId?: string) => {
    if (!newId) {
      application.value = null;
      appsData.value = await fetchApps('');
    } else {
      onAppIdChanged(newId);
    }
  }
)


async function onAppIdChanged(appId: string) {
  application.value = await fetchAppStats(appId);
  applyFilters();
}

function handleScroll(event: Event) {
  if (!application.value) return;
  const target = event.target as HTMLDivElement;
  const { scrollTop, clientHeight, scrollHeight } = target;
  if (scrollTop + clientHeight >= scrollHeight - 50 && !isLoading && hasMore) {
    fetchLogs();
  }
}

function backToApps() {
  router.push({ name: 'logs', params: {} })
}

async function selectApp(app: ApplicationShortStats) {
  router.push({ name: 'logs', params: { applicationId: app.id } })
}

function applyFilters() {
  fetchLogs(true);
}

function deviceSelected(device: ConnectedDevice) {
  router.push({ name: 'online-log-stream', params: { uuid: device.uuid } });
}

const addSearchCriterion = (criterion: SearchCriterion) => {
  criteria.value = [...criteria.value, criterion];
  applyFilters();
};

const addLogLevelCriterion = (logLevel: LogLevel) => {
  const criteriaIndex = criteria.value.findIndex((e) => e.field == SearchFieldKey.LogLevel);
  if (criteriaIndex == -1) {
    criteria.value = [...criteria.value, new SearchCriterion(SearchFieldKey.LogLevel, Operator.In, [logLevel])]
  } else {
    const foundCriteria = criteria.value[criteriaIndex];
    criteria.value[criteriaIndex] = new SearchCriterion(SearchFieldKey.LogLevel, Operator.In, Array.from(new Set([...foundCriteria.value as LogLevel[], logLevel])))
  }
  applyFilters();
};


async function fetchLogs(clear: boolean = false) {
  isLoading = true;
  if (clear) {
    lastTimestamp = undefined;
    lastId = undefined;
    hasMore = true;
  }

  if (!application.value) {
    return;
  }

  const criteriaWithDateTime = [...criteria.value];
  if (dateTimeFilter.value && dateTimeFilter.value.length == 2) {
    const start = dateTimeFilter.value[0].getTime();
    const end = dateTimeFilter.value[1].getTime();
    criteriaWithDateTime.push(new SearchCriterion(SearchFieldKey.Timestamp, Operator.GreaterThan, start));
    criteriaWithDateTime.push(new SearchCriterion(SearchFieldKey.Timestamp, Operator.LessThan, end));
  }

  const eventsResult = await events.search(pageSize, application.value.id, criteriaWithDateTime, lastTimestamp, lastId);
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

    // Обновляем lastTimestamp и lastId для следующей страницы
    if (events.length > 0) {
      const lastEvent = events[events.length - 1];
      lastTimestamp = lastEvent.timestamp;
      lastId = lastEvent.id;
    }
  } else {
    alert(eventsResult.value.message);
  }

  isLoading = false;
}

async function fetchApps(search: string): Promise<ApplicationShortStats[]> {
  const searchResult = await applications.searchApplicationsStats(search, 10, 0);
  if (searchResult.isRight()) {
    return searchResult.value.result.applications;
  }
  return [];
}

async function fetchAppStats(applicationId: string): Promise<ApplicationStatsResponse | null> {
  const searchResult = await applications.getAppStats(applicationId);
  if (searchResult.isRight()) {
    return searchResult.value.result;
  }
  return null;
}

</script>

<style scoped>
.logs-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  font-family: sans-serif;
  overflow-y: auto;
}

.logs-page-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 1.5rem;
  margin-bottom: 0;
  margin-top: 1rem;
}

.go-to-apps {
  width: 2rem;
  height: 2rem;
  cursor: pointer;
}

.app-name {
  margin-left: 1rem;
  font-size: 2rem;
}

.logs-list {
  margin: 1.5rem;
  margin-top: 1rem;
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

.stats-wrapper {
  margin: 1.5rem;
  margin-bottom: 0;
}

.search-action-button {
  width: 1.1rem;
}

.date-picker {
  width: auto;
}

.date-time-input {
  padding-right: 2rem;
}
</style>
