<template>
  <div class="chart-wrapper">
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
      plugins: {
        legend: { position: 'bottom' },
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
  width: 100%;
  height: 200px;
  flex: 1;
}
</style>
