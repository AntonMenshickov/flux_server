<template>
  <div class="apps-container">
    <h2 class="page-title">Logs</h2>
    <!-- Loader -->
    <BaseLoader v-if="isLoading" text="Loading applications..." />
    <!-- Content -->
    <div v-else class="apps-grid">
      <AppCard v-for="(app, index) in appsData" :key="index" @click="selectApp(app)" :appStats="app" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { applications } from '@/api/applications';
import { ref, onMounted } from 'vue';
import type { ApplicationShortStats } from '@/model/application/applicationShortStats';
import AppCard from '@/components/logsList/AppCard.vue';
import BaseLoader from '@/components/base/BaseLoader.vue';
import router from '@/router';

const appsData = ref<ApplicationShortStats[]>([]);
const isLoading = ref(true);

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
  router.push({ name: 'event-logs', params: { applicationId: app.id } });
}
</script>

<style scoped>
.apps-container {
  height: 100%;
  box-sizing: border-box;
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
  overflow-y: auto;
  background: var(--color-secondary);
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 1.5rem 0;
}

.apps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}
</style>

