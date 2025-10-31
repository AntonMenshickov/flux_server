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
import { useThemeStore } from '@/stores/themeStore';

const props = defineProps<{
  appStats: ApplicationShortStats
}>()

// Calculate total events for today
const totalRecords = computed(() => Object.values(props.appStats.stats).reduce((sum, count) => sum + count, 0));

const chartRef = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;
const themeStore = useThemeStore();

function getChartTextColor(): string {
  return getComputedStyle(document.documentElement).getPropertyValue('--color-text').trim() || '#111827';
}

function getChartGridColor(): string {
  return getComputedStyle(document.documentElement).getPropertyValue('--color-border').trim() || '#ccc';
}

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
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          color: getChartTextColor(),
        },
        grid: {
          color: getChartGridColor(),
        },
      },
      x: {
        ticks: {
          color: getChartTextColor(),
        },
        grid: {
          color: getChartGridColor(),
        },
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

watch(() => themeStore.effectiveTheme, () => {
  renderChart();
});

</script>

<style scoped>
.app-card {
  width: 300px;
  height: auto;
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  background-color: var(--color-panel-bg);
  box-shadow: var(--box-shadow);
  transition: box-shadow var(--transition-base), background-color var(--transition-base), color var(--transition-base);
  cursor: pointer;
  color: var(--color-text);
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
  color: var(--color-text);
  transition: color var(--transition-base);
}

.app-today-records {
  color: var(--color-text-dimmed);
  transition: color var(--transition-base);
}

</style>
