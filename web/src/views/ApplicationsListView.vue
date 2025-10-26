<template>
  <div class="apps-container">
    <h2 class="page-title">Logs</h2>
    <div class="apps-grid">
      <AppCard v-for="(app, index) in appsData" :key="index" @click="selectApp(app)" :appStats="app" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { applications } from '@/api/applications';
import { ref, onMounted } from 'vue';
import type { ApplicationShortStats } from '@/model/application/applicationShortStats';
import AppCard from '@/components/logsList/AppCard.vue';
import router from '@/router';

const appsData = ref<ApplicationShortStats[]>([]);

onMounted(async () => {
  appsData.value = await fetchApps('');
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
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
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

