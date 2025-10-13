<template>
  <div class="chart-wrapper">
    <div class="totals" v-if="hasAnyData">
      <div class="totals-header">
        <div class="totals-title">Totals</div>
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
        <div class="totals-row" v-for="lvl in logLevels" :key="lvl">
          <span class="level-chip" :class="`level-${lvl}`"></span>
          <span class="totals-label">{{ lvl }}</span>
          <span class="spacer"></span>
          <span class="totals-value">{{ totalByLevel[lvl] ?? 0 }}</span>
        </div>
      </div>
    </div>

    <div class="charts">
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { Chart } from 'chart.js';
import { LogLevel } from '@/model/event/logLevel';
import type { ApplicationStatsResponse } from '@/api/applications';

const props = defineProps<{ application: ApplicationStatsResponse }>();
const logLevels = Object.values(LogLevel);

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
  props.application.stats.some(d => d.logLevelStats !== undefined)
);
const hasPlatformData = computed(() =>
  props.application.stats.some(d => d.platformStats !== undefined)
);
const hasOsData = computed(() =>
  props.application.stats.some(d => d.osStats !== undefined)
);

// ---------- chart rendering ----------

const renderCharts = () => {
  if (!props.application.stats.length) return;

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
      const mergedPlatform = sumMaps(props.application.stats.map(s => s.platformStats));
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
      const mergedOs = sumMaps(props.application.stats.map(s => s.osStats));
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
          },
        });
      }
    }
  } else {
    osChart?.destroy();
    osChart = null;
  }
};

onMounted(() => {
  renderCharts();
});
watch(() => props.application, renderCharts, { deep: true });
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

.charts {
  display: flex;
  flex-direction: row;
  flex: 1;
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

.totals {
  min-width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.totals-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.totals-title {
  font-weight: 700;
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

.level-chip {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  display: inline-block;
}

.level-info { background-color: var(--log-info); }
.level-warn { background-color: var(--log-warn); }
.level-error { background-color: var(--log-error); }
.level-debug { background-color: var(--log-debug); }
</style>
