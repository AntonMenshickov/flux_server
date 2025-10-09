<!-- AppCard.vue -->
<template>
  <div class="app-card">
    <div class="app-card-header">
      <div class="app-name">{{ appStats.name }}</div>
      <div class="app-today-records">Today records: {{ totalRecords }}</div>
    </div>
    <canvas ref="chartRef"></canvas>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { Chart, type ChartData, type ChartOptions, registerables } from 'chart.js';
import type { ApplicationStats } from '@/model/application/applicationStats';

Chart.register(...registerables);

const props = defineProps<{
  appStats: ApplicationStats
}>()



const totalRecords = computed(() => Object.values(props.appStats.stats).reduce((sum, count) => sum + count, 0));

const chartRef = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

const renderChart = () => {
  if (!chartRef.value) return;

  const data: ChartData<'bar'> = {
    labels: Object.keys(props.appStats.stats),
    datasets: [
      {
        label: 'Количество записей',
        data: Object.values(props.appStats.stats),
        backgroundColor: ['#3b82f6', '#ef4444', '#f59e0b', '#a36fad'],
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(chartRef.value, {
    type: 'bar',
    data,
    options,
  });
};

onMounted(() => renderChart());

watch(() => props.appStats, () => renderChart(), { deep: true });

</script>

<style scoped>
.app-card {
  width: 300px;
  height: auto;
  padding: 1rem;
  border-radius: var(--border-radius);
  background-color: white;
  box-shadow: var(--box-shadow);
  transition: box-shadow 0.2s;
  cursor: pointer;
}

.app-card:hover {
  box-shadow: var(--box-shadow-strong);
}

.app-card-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.app-name {
  font-weight: bolder;
}

.app-today-records {
  color: var(--color-text-dimmed);
}

</style>
