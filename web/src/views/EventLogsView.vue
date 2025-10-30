<template>
  <BasePage :isLoading="!application" loaderText="Loading application..." compact @scroll="handleScroll">
    <div v-if="application" class="logs-content">
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
            <EventsFilterSelector v-if="application" v-model="selectedFilter" :criteria="criteria" :applicationId="application.id" @filterApplied="onFilterApplied" />
            <DateRangePicker v-model="dateTimeFilter" @update:model-value="applyFilters" />
          </div>
          <div class="search-row">
            <div class="search-container">
              <SmartSearch :options="fieldOptions" v-model="criteria" @update:modelValue="applyFilters"
                class="smart-search-field" />
            </div>
            <BaseButton v-if="criteria.length > 0 || dateTimeFilter" @click="shareFilters" title="Share filters">
              <LinkIcon class="reload-icon" />
              Share
            </BaseButton>
            <BaseButton @click="fetchLogs(true)" title="Reload">
              <ArrowPathIcon class="reload-icon" />
              Refresh
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- Share Link Dialog -->
      <ModalDialog :show="showShareDialog" cancel-text="Close" :confirm-text="null" :is-danger="false"
        @cancel="closeShareDialog">
        <div class="share-dialog-content">
          <p>Share this filter with a link:</p>
          <div class="share-link-container">
            <input ref="shareLinkInput" :value="shareLink" readonly class="share-link-input" />
            <BaseButton @click="copyShareLink" title="Copy link">
              <DocumentDuplicateIcon class="action-icon" />
              {{ isCopied ? 'Copied!' : 'Copy' }}
            </BaseButton>
          </div>
        </div>
      </ModalDialog>

      <!-- Logs List -->
      <div class="logs-section">
        <div class="logs-header">
          <h3 class="section-title">Event Logs</h3>
          <span class="logs-count" v-if="logs.length > 0 && !isInitialLoading">{{ logs.length }} events</span>
        </div>

        <!-- Initial Loading -->
        <div v-if="isInitialLoading" class="initial-loader">
          <BaseLoader text="Loading logs..." />
        </div>

        <!-- Logs List -->
        <div v-else class="logs-list">
          <LogCard v-for="(log) in logs" :key="log.id" :log="log" :showLink="true" @search="addSearchCriterion" />

          <!-- Pagination Loading -->
          <div v-if="isLoading && hasMore" class="pagination-loader">
            <BaseLoader :size="32" :min-height="100" :border-width="3" text="Loading more..." />
          </div>
        </div>
      </div>
    </div>
  </BasePage>
</template>

<script setup lang="ts">
import { applications, type ApplicationStatsResponse, type ConnectedDevice } from '@/api/applications';
import { events } from '@/api/events';
import { eventFilters } from '@/api/eventFilters';
import { ref, onMounted, watch } from 'vue';
import type { EventMessage } from '@/model/event/eventMessage';
import LogCard from '@/components/base/LogCard.vue';
import SmartSearch from '@/components/base/smartSearch/SmartSearch.vue';
import { Operator, SearchCriterion, SearchFieldKey } from '@/components/base/smartSearch/types';
import { ArrowPathIcon, LinkIcon, DocumentDuplicateIcon } from '@heroicons/vue/24/outline';
import AppStatsChart from '@/components/logsList/AppStatsChart.vue';
import OnlineDevices from '@/components/logsList/OnlineDevices.vue';
import EventsFilterSelector from '@/components/logsList/EventsFilterSelector.vue';
import { fieldOptions } from '@/components/base/smartSearch/searchCriterions';
import router from '@/router';
import { useRoute } from 'vue-router';
import type { LogLevel } from '@/model/event/logLevel';
import BaseButton from '@/components/base/BaseButton.vue';
import BasePage from '@/components/base/BasePage.vue';
import BaseLoader from '@/components/base/BaseLoader.vue';
import DateRangePicker from '@/components/base/DateRangePicker.vue';
import PageHeader from '@/components/base/PageHeader.vue';
import ModalDialog from '@/components/ModalDialog.vue';
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
const isInitialLoading = ref(false);
const isLoading = ref(false);
let lastTimestamp: number | undefined = undefined;
let lastId: string | undefined = undefined;
let hasMore = true;

const route = useRoute();
const showShareDialog = ref(false);
const shareLink = ref('');
const shareLinkInput = ref<HTMLInputElement | null>(null);
const currentShareToken = ref<string | null>(null);
const isCopied = ref(false);

onMounted(async () => {
  const appId = route.params.applicationId?.toString();
  const shareToken = route.query.shareToken?.toString();
  
  if (shareToken) {
    // Load shared filter
    currentShareToken.value = shareToken;
    await loadSharedFilter(shareToken, appId);
  } else if (appId) {
    onAppIdChanged(appId);
  }
});

watch<string>(
  () => route.params.applicationId?.toString(),
  async (newId?: string) => {
    if (newId) {
      // Clear shareToken when navigating to different application
      currentShareToken.value = null;
      onAppIdChanged(newId);
    }
  }
);

watch(
  () => route.query.shareToken?.toString(),
  async (shareToken?: string) => {
    if (shareToken && shareToken !== currentShareToken.value) {
      const appId = route.params.applicationId?.toString();
      currentShareToken.value = shareToken;
      await loadSharedFilter(shareToken, appId);
    } else if (!shareToken) {
      currentShareToken.value = null;
    }
  }
);

async function onAppIdChanged(appId: string) {
  application.value = await fetchAppStats(appId);
  applyFilters();
}

function handleScroll(event: Event) {
  if (!application.value) return;
  const target = event.target as HTMLDivElement;
  const { scrollTop, clientHeight, scrollHeight } = target;
  if (scrollTop + clientHeight >= scrollHeight - 50 && !isLoading.value && hasMore) {
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
  isLoading.value = true;
  if (clear) {
    isInitialLoading.value = true;
    lastTimestamp = undefined;
    lastId = undefined;
    hasMore = true;
  }

  if (!application.value) {
    isInitialLoading.value = false;
    isLoading.value = false;
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

  isLoading.value = false;
  isInitialLoading.value = false;
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

async function shareFilters() {
  if (!application.value) {
    alert('Application is required to share filter');
    return;
  }

  isLoading.value = true;
  
  try {
    let result;
    
    // Если выбран сохраненный фильтр, используем его ID
    if (selectedFilter.value) {
      result = await eventFilters.share({
        filterId: selectedFilter.value.id,
        applicationId: application.value.id,
      });
    } else {
      // Иначе создаем новый фильтр из текущих критериев
      if (criteria.value.length === 0 && !dateTimeFilter.value) {
        alert('Please add at least one filter criterion or date range');
        isLoading.value = false;
        return;
      }

      // Convert SearchCriterion[] to Criterion[]
      const criteriaList = criteria.value
        .map(c => c.toCriterion())
        .filter(c => c !== null) as Criterion[];

      // Prepare dateTimeRange if exists
      const dateTimeRange = dateTimeFilter.value && dateTimeFilter.value.length === 2 ? {
        start: dateTimeFilter.value[0].getTime(),
        end: dateTimeFilter.value[1].getTime(),
      } : undefined;

      result = await eventFilters.share({
        criteria: criteriaList,
        dateTimeRange,
        applicationId: application.value.id,
      });
    }

    if (result.isRight()) {
      const shareToken = result.value.result.shareToken;
      const appId = application.value.id;
      const baseUrl = window.location.origin + window.location.pathname.replace(/\/$/, '');
      const shareUrl = `${baseUrl}#/dashboard/logs/${appId}?shareToken=${shareToken}`;
      shareLink.value = shareUrl;
      showShareDialog.value = true;
    } else {
      alert(`Failed to create share link: ${result.value.message}`);
    }
  } catch (error) {
    alert(`Failed to create share link: ${error}`);
  } finally {
    isLoading.value = false;
  }
}

function closeShareDialog() {
  showShareDialog.value = false;
  shareLink.value = '';
  isCopied.value = false;
}

async function copyShareLink() {
  if (shareLinkInput.value) {
    shareLinkInput.value.select();
    try {
      await navigator.clipboard.writeText(shareLink.value);
    } catch {
      // Fallback for older browsers
      document.execCommand('copy');
    }
    isCopied.value = true;
    setTimeout(() => {
      isCopied.value = false;
    }, 2000);
  }
}

async function loadSharedFilter(shareToken: string, appId?: string) {
  isLoading.value = true;
  isInitialLoading.value = true;

  try {
    const result = await eventFilters.getShared(shareToken);

    if (result.isRight()) {
      const filterData = result.value.result;
      
      // Convert Criterion[] to SearchCriterion[]
      const searchCriteria = filterData.criteria
        .map(c => SearchCriterion.fromCriterion(c))
        .filter(c => c !== null) as SearchCriterion[];
      
      criteria.value = searchCriteria;

      // Set dateTimeRange if exists
      if (filterData.dateTimeRange) {
        dateTimeFilter.value = [
          new Date(filterData.dateTimeRange.start),
          new Date(filterData.dateTimeRange.end),
        ];
      }

      // Load application if appId provided or from filter data
      const targetAppId = appId || filterData.applicationId;
      if (targetAppId) {
        application.value = await fetchAppStats(targetAppId);
        if (application.value) {
          applyFilters();
        }
      } else if (application.value) {
        applyFilters();
      }
    } else {
      alert(`Failed to load shared filter: ${result.value.message}`);
      if (appId) {
        onAppIdChanged(appId);
      }
    }
  } catch (error) {
    alert(`Failed to load shared filter: ${error}`);
    if (appId) {
      onAppIdChanged(appId);
    }
  } finally {
    isLoading.value = false;
    isInitialLoading.value = false;
  }
}


</script>

<style scoped>
.logs-content {
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

.initial-loader {
  margin: 2rem 0;
}

.pagination-loader {
  margin-top: 1rem;
  margin-bottom: 1rem;
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

/* Share Dialog Styles */
.share-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.share-link-container {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.share-link-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 0.875rem;
  background-color: var(--color-secondary);
  color: var(--color-text);
}

.share-link-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.action-icon {
  width: 1rem;
  height: 1rem;
}

/* Smooth transitions */
* {
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}
</style>
