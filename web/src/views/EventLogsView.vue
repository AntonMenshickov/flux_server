<template>
  <BasePage :isLoading="!application" loaderText="Loading application..." compact @scroll="handleScroll">
    <div v-if="application" class="logs-container">
      <!-- Header Section -->
      <PageHeader :title="application.name" @back="backToApps">
        <template #right>
          <OnlineDevices :applicationId="application.id" @update:select="deviceSelected" />
        </template>
      </PageHeader>

      <!-- Statistics Section -->
      <div class="stats-section">
        <AppStatsChart :application="application" @search="addLogLevelCriterion" />
      </div>

      <!-- Search and Filters Section -->
      <div class="filters-section">
        <div class="filters-header">
          <h3 class="section-title">Filters</h3>
        </div>
        <div class="filters-content">
          <div class="filter-row">
            <EventsFilterSelector v-model="selectedFilter" :criteria="criteria" @filterApplied="onFilterApplied" />
            <DateRangePicker v-model="dateTimeFilter" @update:model-value="applyFilters" />
          </div>
          <div class="search-row">
            <div class="search-container">
              <SmartSearch :options="fieldOptions" v-model="criteria" @update:modelValue="applyFilters" 
                class="smart-search-field" />
            </div>
            <BaseButton @click="fetchLogs(true)" title="Reload">
              <ArrowPathIcon class="reload-icon" />
              Refresh
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- Logs List -->
      <div class="logs-section">
        <div class="logs-header">
          <h3 class="section-title">Event Logs</h3>
          <span class="logs-count" v-if="logs.length > 0">{{ logs.length }} events</span>
        </div>
        <div class="logs-list">
          <LogCard v-for="(log) in logs" :key="log.id" :log="log" @search="addSearchCriterion" />
        </div>
      </div>
    </div>
  </BasePage>
</template>

<script setup lang="ts">
import { applications, type ApplicationStatsResponse, type ConnectedDevice } from '@/api/applications';
import { events } from '@/api/events';
import { ref, onMounted, watch } from 'vue';
import type { EventMessage } from '@/model/event/eventMessage';
import LogCard from '@/components/base/LogCard.vue';
import SmartSearch from '@/components/base/smartSearch/SmartSearch.vue';
import { Operator, SearchCriterion, SearchFieldKey } from '@/components/base/smartSearch/types';
import { ArrowPathIcon } from '@heroicons/vue/24/outline';
import AppStatsChart from '@/components/logsList/AppStatsChart.vue';
import OnlineDevices from '@/components/logsList/OnlineDevices.vue';
import EventsFilterSelector from '@/components/logsList/EventsFilterSelector.vue';
import { fieldOptions } from '@/components/base/smartSearch/searchCriterions';
import router from '@/router';
import { useRoute } from 'vue-router';
import type { LogLevel } from '@/model/event/logLevel';
import BaseButton from '@/components/base/BaseButton.vue';
import BasePage from '@/components/base/BasePage.vue';
import DateRangePicker from '@/components/base/DateRangePicker.vue';
import PageHeader from '@/components/base/PageHeader.vue';
import type { Criterion } from '@/components/base/smartSearch/types';

interface EventsFilter {
  id: string;
  name: string;
  criteria: Criterion[];
  createdAt: Date;
  updatedAt?: Date;
}

const logs = ref<EventMessage[]>([]);
const application = ref<ApplicationStatsResponse | null>(null);
const dateTimeFilter = ref<Date[] | null>(null);
const criteria = ref<SearchCriterion[]>([]);
const selectedFilter = ref<EventsFilter | null>(null);
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
  }
});

watch<string>(
  () => route.params.applicationId?.toString(),
  async (newId?: string) => {
    if (newId) {
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
  router.push({ name: 'logs' });
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

async function fetchAppStats(applicationId: string): Promise<ApplicationStatsResponse | null> {
  const searchResult = await applications.getAppStats(applicationId);
  if (searchResult.isRight()) {
    return searchResult.value.result;
  }
  return null;
}

function onFilterApplied(newCriteria: SearchCriterion[]) {
  criteria.value = newCriteria;
  applyFilters();
}

</script>

<style scoped>
.logs-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Statistics Section */
.stats-section {
  background: white;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

/* Filters Section */
.filters-section {
  background: white;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.filters-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.25rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.filters-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.filter-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
}

.search-row {
  display: flex;
  gap: 1rem;
  align-items: start;
}

.search-container {
  flex: 1;
  min-width: 300px;
}

.smart-search-field {
  width: 100%;
}

.reload-icon {
  width: 1.25rem;
  height: 1.25rem;
}

/* Logs Section */
.logs-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.logs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.25rem;
}

.logs-count {
  font-size: 0.875rem;
  color: var(--color-text-dimmed);
  font-weight: 500;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .logs-container {
    padding: 1.25rem 1rem;
    gap: 1.5rem;
  }

  .filter-row,
  .search-row {
    flex-direction: column;
  }

  .search-container {
    min-width: 100%;
  }

  .reload-button {
    width: 100%;
    justify-content: center;
  }

  .app-title {
    font-size: 1.5rem;
  }
}

/* Smooth transitions */
* {
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}
</style>

