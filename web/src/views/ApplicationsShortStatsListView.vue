<template>
  <BasePage :isLoading="isLoading" loaderText="Loading applications..." title="Logs">
    <div v-if="appsData.length > 0" class="apps-grid">
      <AppCard v-for="(app, index) in appsData" :key="index" @click="selectApp(app)" :appStats="app" />
    </div>
    <div v-else class="no-apps-message">
      <p>No applications found</p>
    </div>
  </BasePage>
</template>

<script setup lang="ts">
import { applications } from '@/api/applications';
import { ref, onMounted } from 'vue';
import type { ApplicationShortStats } from '@/model/application/applicationShortStats';
import AppCard from '@/components/logsList/AppCard.vue';
import BasePage from '@/components/base/BasePage.vue';
import { useRouterUtils } from '@/utils/routerUtils';

const appsData = ref<ApplicationShortStats[]>([]);
const isLoading = ref(true);
const routerUtils = useRouterUtils();

onMounted(async () => {
  isLoading.value = true;
  appsData.value = await fetchApps('');
  isLoading.value = false;
});

async function fetchApps(search: string): Promise<ApplicationShortStats[]> {
  const searchResult = await applications.searchApplicationsStats(search, 10, 0);
  if (searchResult.isRight()) {
    return searchResult.value.result.applications;
  }
  return [];
}

async function selectApp(app: ApplicationShortStats) {
  routerUtils.navigateToEventLogs(app.id);
}
</script>

<style scoped>
.apps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.no-apps-message {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--spacing-xxxl);
  text-align: center;
}

.no-apps-message p {
  color: var(--color-text-dimmed);
  font-size: var(--font-size-xl);
}
</style>

