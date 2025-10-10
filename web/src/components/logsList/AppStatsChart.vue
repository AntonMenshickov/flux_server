<template>
  <div class="chart-wrapper">
    <div class="title">Statistics</div>
    <canvas ref="chartRef" />
  </div>
</template>


<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Chart } from 'chart.js';
import type { IApplicationStats } from '@/model/application/applicationStats';
import { LogLevel } from '@/model/event/logLevel';

// ✅ входной параметр
const props = defineProps<{
  data: IApplicationStats[];
}>();

const chartRef = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

const logColors: Record<LogLevel, string> = {
  [LogLevel.INFO]: '#3b82f6',
  [LogLevel.WARN]: '#f59e0b',
  [LogLevel.ERROR]: '#ef4444',
  [LogLevel.DEBUG]: '#a36fad',
};

const renderChart = () => {
  if (!chartRef.value || !props.data.length) return;
  const ctx = chartRef.value.getContext('2d');
  if (!ctx) return;

  const logLevels = Object.values(LogLevel);
  const labels = props.data.map(s => new Date(s.date).toLocaleDateString());

  const datasets = logLevels.map(level => ({
    label: level,
    data: props.data.map(s => s.logLevelStats[level as LogLevel]),
    borderColor: logColors[level],
    backgroundColor: logColors[level],
    borderWidth: 2,
    tension: 0.2,
    fill: false,
  }));

  if (chartInstance) {
    chartInstance.destroy();
  }
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      animation: {
        duration: 0,
      },
      plugins: {
        legend: { display: false },
        title: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 },
        },
      },
    },
  });
};

onMounted(renderChart);

// 🔄 Автоматическая перерисовка при изменении входных данных
watch(() => props.data, renderChart, { deep: true });
</script>

<style scoped>
.chart-wrapper {
  min-width: 400px;
  height: auto;
  padding: 1rem;
  border-radius: var(--border-radius);
  background-color: white;
  box-shadow: var(--box-shadow);
}

.title {
  margin-bottom: 0.5rem;
  font-weight: bolder;
}
</style>
