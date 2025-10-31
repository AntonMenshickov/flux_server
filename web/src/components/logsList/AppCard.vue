<!-- AppCard.vue -->
<template>
  <div class="app-card">
    <div class="app-card-header">
      <div class="app-name">{{ appStats.name }}</div>
      <div class="app-today-records">Today: {{ totalRecords }} events</div>
    </div>
    <canvas ref="chartRef"></canvas>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { Chart, type ChartData, type ChartOptions } from 'chart.js';
import type { ApplicationShortStats } from '@/model/application/applicationShortStats';
import { LogLevel } from '@/model/event/logLevel';

const props = defineProps<{
  appStats: ApplicationShortStats
}>()

// Calculate total events for today
const totalRecords = computed(() => Object.values(props.appStats.stats).reduce((sum, count) => sum + count, 0));

const chartRef = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

const renderChart = () => {
  if (!chartRef.value) return;

  const orderedLevels = [
    LogLevel.INFO,
    LogLevel.WARN,
    LogLevel.ERROR,
    LogLevel.CRASH,
    LogLevel.DEBUG,
  ];

  const logColors: Record<LogLevel, string> = {
    [LogLevel.INFO]: '#3b82f6',
    [LogLevel.WARN]: '#f59e0b',
    [LogLevel.ERROR]: '#ef4444',
    [LogLevel.CRASH]: '#8B0000',
    [LogLevel.DEBUG]: '#a36fad',
  };

  const data: ChartData<'bar'> = {
    labels: orderedLevels,
    datasets: [
      {
        label: 'Events amount',
        data: orderedLevels.map(l => props.appStats.stats[l] ?? 0),
        backgroundColor: orderedLevels.map(l => logColors[l]),
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    animation: {
      duration: 0
    },
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
  margin-bottom: 0.5rem;
}

.app-name {
  font-weight: bolder;
}

.app-today-records {
  color: var(--color-text-dimmed);
}

</style>
