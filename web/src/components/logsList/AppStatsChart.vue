<template>
  <div class="chart-wrapper">

    <div v-if="hasLogLevelData" class="chart-section">
      <div class="subtitle">Logs by Level</div>
      <canvas ref="logChartRef" />
    </div>

    <div v-if="hasPlatformData" class="chart-section">
      <div class="subtitle">Platforms</div>
      <canvas ref="platformChartRef" />
    </div>

    <div v-if="hasOsData" class="chart-section">
      <div class="subtitle">Operating Systems</div>
      <canvas ref="osChartRef" />
    </div>

    <div v-if="!hasLogLevelData && !hasPlatformData && !hasOsData" class="empty-message">
      No statistics available
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { Chart } from 'chart.js';
import type { IApplicationStats } from '@/model/application/applicationStats';
import { LogLevel } from '@/model/event/logLevel';

const props = defineProps<{ data: IApplicationStats[] }>();

const logChartRef = ref<HTMLCanvasElement | null>(null);
const platformChartRef = ref<HTMLCanvasElement | null>(null);
const osChartRef = ref<HTMLCanvasElement | null>(null);

let logChart: Chart | null = null;
let platformChart: Chart | null = null;
let osChart: Chart | null = null;

const logColors: Record<LogLevel, string> = {
  [LogLevel.INFO]: '#3b82f6',
  [LogLevel.WARN]: '#f59e0b',
  [LogLevel.ERROR]: '#ef4444',
  [LogLevel.DEBUG]: '#a36fad',
};

// ---------- helpers ----------

function sumMaps(
  maps: (Map<string, number> | Record<string, number> | undefined)[]
): Map<string, number> {
  const result = new Map<string, number>();

  for (const m of maps) {
    if (!m) continue;

    // Проверяем, что это настоящий Map
    if (m instanceof Map) {
      for (const [key, value] of m) {
        result.set(key, (result.get(key) ?? 0) + value);
      }
    } else {
      // Любой объект, включая reactive Proxy
      for (const [key, value] of Object.entries(m)) {
        result.set(key, (result.get(key) ?? 0) + value as number);
      }
    }
  }

  return result;
}

function colorFromString(str: string, saturation = 50, lightness = 65): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// ---------- computed checks ----------

const hasLogLevelData = computed(() =>
  props.data.some(d => d.logLevelStats !== undefined)
);
const hasPlatformData = computed(() =>
  props.data.some(d => d.platformStats !== undefined)
);
const hasOsData = computed(() =>
  props.data.some(d => d.osStats !== undefined)
);

// ---------- chart rendering ----------

const renderCharts = () => {
  if (!props.data.length) return;

  // --- 1. Линейный график logLevel по дням ---
  if (hasLogLevelData.value && logChartRef.value) {
    const ctx = logChartRef.value.getContext('2d');
    if (ctx) {
      const logLevels = Object.values(LogLevel);
      const labels = props.data.map(s => new Date(s.date).toLocaleDateString());

      const datasets = logLevels.map(level => ({
        label: level,
        data: props.data.map(s => s.logLevelStats?.[level as LogLevel] ?? 0),
        borderColor: logColors[level],
        backgroundColor: logColors[level],
        borderWidth: 2,
        tension: 0.2,
        fill: false,
      }));

      logChart?.destroy();
      logChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
          responsive: true,
          animation: { duration: 0 },
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
        },
      });
    }
  } else {
    logChart?.destroy();
    logChart = null;
  }

  // --- 2. Bar-chart по platformStats ---
  if (hasPlatformData.value && platformChartRef.value) {
    const ctx = platformChartRef.value.getContext('2d');
    if (ctx) {
      const mergedPlatform = sumMaps(props.data.map(s => s.platformStats));
      if (mergedPlatform.size > 0) {
        const labels = Array.from(mergedPlatform.keys());
        const values = Array.from(mergedPlatform.values());

        // <-- вычисляем цвет для каждой платформы -->
        const colors = labels.map(label => colorFromString(label));

        platformChart?.destroy();
        platformChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                data: values,
                backgroundColor: colors, // используем динамические цвета
              },
            ],
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, ticks: { precision: 0 } },
            },
          },
        });
      }
    }
  } else {
    platformChart?.destroy();
    platformChart = null;
  }

  // --- 3. Donut-chart по osStats ---
  if (hasOsData.value && osChartRef.value) {
    const ctx = osChartRef.value.getContext('2d');
    if (ctx) {
      const mergedOs = sumMaps(props.data.map(s => s.osStats));
      if (mergedOs.size > 0) {
        const labels = Array.from(mergedOs.keys());
        const values = Array.from(mergedOs.values());
        const colors = labels.map(label => colorFromString(label));

        osChart?.destroy();
        osChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                data: values,
                backgroundColor: colors,
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
          },
        });
      }
    }
  } else {
    osChart?.destroy();
    osChart = null;
  }
};

onMounted(renderCharts);
watch(() => props.data, renderCharts, { deep: true });
</script>

<style scoped>
.chart-wrapper {
  display: flex;
  flex-direction: row;
  gap: 1.5rem;
  flex: 1;
  padding: 1rem;
  border-radius: var(--border-radius);
  border: 1px solid var(--color-border);
  background-color: white;
}

.title {
  font-weight: bolder;
  margin-bottom: 0.5rem;
}

.subtitle {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.chart-section {
  width: 100%;
}

.empty-message {
  text-align: center;
  color: var(--color-text-dimmed);
  font-style: italic;
  padding: 1rem;
}
</style>
