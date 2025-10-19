<template>
  <div class="chart-wrapper">
    <div class="totals" v-if="hasAnyData">
      <div class="totals-header">
        <div class="totals-title">Summary</div>
        <div class="bundles" v-if="props.application.bundles?.length">
          <div class="totals-row totals-overall">
            <span class="totals-label">Bundles</span>
            <span class="totals-value">{{ props.application.bundles.length }}</span>
          </div>
          <ul class="bundles-list">
            <li v-for="(b, idx) in props.application.bundles" :key="idx" class="bundle-item">
              <span class="bundle-platform">{{ b.platform }}</span>
              <span class="bundle-sep">•</span>
              <span class="bundle-id" :title="b.bundleId">{{ b.bundleId }}</span>
            </li>
          </ul>
        </div>
      </div>
      <div class="totals-body">
        <div class="totals-row totals-overall">
          <span class="totals-label">All records</span>
          <span class="totals-value">{{ totalAll }}</span>
        </div>
        <div class="totals-row log-level-value" v-for="lvl in logLevels" :key="lvl" @click="() => emitSearch(lvl)">
          <span class="level-chip" :class="`level-${lvl}`"></span>
          <span class="totals-label">{{ lvl }}</span>
          <span class="spacer"></span>
          <span class="totals-value">{{ totalByLevel[lvl] ?? 0 }}</span>
        </div>
      </div>
    </div>
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
import { LogLevel } from '@/model/event/logLevel';
import type { ApplicationStatsResponse } from '@/api/applications';

onMounted(() => {
  renderCharts();
});
const emit = defineEmits<{
  (e: 'search', logLevel: LogLevel): void
}>();

const props = defineProps<{ application: ApplicationStatsResponse }>();
const logLevels = Object.values(LogLevel);

const lastSevenDaysStats = computed(() => props.application.stats.slice(-7));

const hasAnyData = computed(() => props.application.stats.length > 0);

const totalByLevel = computed<Record<LogLevel, number>>(() => {
  const totals = Object.values(LogLevel).reduce((acc, lvl) => {
    acc[lvl as LogLevel] = 0;
    return acc;
  }, {} as Record<LogLevel, number>);
  for (const stat of props.application.stats) {
    for (const lvl of Object.values(LogLevel)) {
      totals[lvl as LogLevel] += stat.logLevelStats?.[lvl as LogLevel] ?? 0;
    }
  }
  return totals;
});

watch(() => props.application, () => {
  renderCharts();
}, { deep: true });


const totalAll = computed(() => Object.values(totalByLevel.value).reduce((a, b) => a + b, 0));

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
  [LogLevel.CRASH]: '#8B0000',
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
  lastSevenDaysStats.value.some(d => d.logLevelStats !== undefined)
);
const hasPlatformData = computed(() =>
  lastSevenDaysStats.value.some(d => d.platformStats !== undefined)
);
const hasOsData = computed(() =>
  lastSevenDaysStats.value.some(d => d.osStats !== undefined)
);

// ---------- chart rendering ----------

const renderCharts = () => {
  if (!lastSevenDaysStats.value.length) return;

  // --- 1. Линейный график logLevel по дням ---
  if (hasLogLevelData.value && logChartRef.value) {
    const ctx = logChartRef.value.getContext('2d');
    if (ctx) {
      const logLevels = Object.values(LogLevel);
      const labels = props.application.stats.map(s => new Date(s.date).toLocaleDateString());

      const datasets = logLevels.map(level => ({
        label: level,
        data: props.application.stats.map(s => s.logLevelStats?.[level as LogLevel] ?? 0),
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
          scales: { y: { beginAtZero: true, ticks: { precision: 0 }, } },
          interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
          },
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
      const mergedPlatform = sumMaps(lastSevenDaysStats.value.map(s => s.platformStats));
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
            animation: { duration: 0 },
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, ticks: { precision: 0 } },
              x: {
                ticks: {
                  callback: function (value) {
                    const label = typeof value === 'string' ? `${value}` : this.getLabelForValue(value);
                    return label.length > 10 ? label.slice(0, 10) + '...' : label;
                  }
                }
              }
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
      const mergedOs = sumMaps(lastSevenDaysStats.value.map(s => s.osStats));
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
            animation: { duration: 0 },
            plugins: { legend: { display: false } },
            scales: {
              x: {
                ticks: {
                  callback: function (value) {
                    const label = typeof value === 'string' ? `${value}` : this.getLabelForValue(value);
                    return label.length > 10 ? label.slice(0, 10) + '...' : label;
                  }
                }
              }
            }
          },
        });
      }
    }
  } else {
    osChart?.destroy();
    osChart = null;
  }
};

function emitSearch(value: LogLevel) {
  emit('search', value);
}


</script>

<style scoped>
.chart-wrapper {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  flex-wrap: wrap;
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
  min-width: 300px;
  max-width: 450px;
  flex: 1;
}

.chart-section canvas {
  max-width: 100%;
  height: auto !important;
  display: block;
}

.empty-message {
  text-align: center;
  color: var(--color-text-dimmed);
  font-style: italic;
  padding: 1rem;
}

.totals {
  min-width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.75rem;
  flex: 1;
}

.totals-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.totals-title {
  font-weight: 700;
  align-self: flex-start;
}

/* bundles-title removed in favor of consistent totals-row styling */

.bundles-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.bundle-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.bundle-platform {
  font-weight: 600;
}

.bundle-sep {
  color: var(--color-text-dimmed);
}

.bundle-id {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.totals-body {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.totals-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
}

.totals-overall {
  border-bottom: 1px dashed var(--color-border);
  margin-bottom: 0.25rem;
}

.totals-label {
  color: var(--color-text);
}

.totals-value {
  font-weight: 700;
}

.log-level-value {
  cursor: pointer;
}

.level-chip {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  display: inline-block;
}

.level-info {
  background-color: var(--log-info);
}

.level-warn {
  background-color: var(--log-warn);
}

.level-error {
  background-color: var(--log-error);
}

.level-crash {
  background-color: var(--log-crash);
}

.level-debug {
  background-color: var(--log-debug);
}
</style>
