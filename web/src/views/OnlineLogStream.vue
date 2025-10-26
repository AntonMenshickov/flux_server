<template>
  <div class="online-log-stream">
    <!-- Loader -->
    <BaseLoader v-if="isLoading" text="Loading device..." />

    <!-- Content -->
    <div v-else class="stream-container">
      <!-- Header Section -->
      <PageHeader 
        :title="connectedDevice?.deviceName || ''" 
        :subtitle="connectedDevice ? `(${connectedDevice.deviceId})` : undefined"
        :subtitleInline="true"
        @back="goBack">
        <template #right>
          <div class="status-indicators">
            <span :title="`Websocket ${connectionStatus}`" class="status-badge">
              <WifiIcon :class="'ws-icon ws-' + connectionStatus" />
              <span class="status-text">{{ connectionStatus }}</span>
            </span>
            <span :title="deviceConnected ? 'Device online' : 'Device offline'" class="status-badge">
              <DevicePhoneMobileIcon :class="{ 'device-icon': true, 'device-connected': deviceConnected }" />
              <span class="status-text">{{ deviceConnected ? 'online' : 'offline' }}</span>
            </span>
          </div>
        </template>
      </PageHeader>

      <!-- Device Info Section -->
      <div class="device-info-section">
        <div v-if="connectedDevice" class="device-info-content">
          <div class="info-compact-row">
            <div class="info-compact-item">
              <span class="info-compact-label">Platform:</span>
              <span class="info-compact-value">{{ connectedDevice.platform }}</span>
            </div>
            <div class="info-compact-item">
              <span class="info-compact-label">OS:</span>
              <span class="info-compact-value">{{ connectedDevice.osName }}</span>
            </div>
            <div class="info-compact-item">
              <span class="info-compact-label">Bundle ID:</span>
              <span class="info-compact-value">{{ connectedDevice.bundleId }}</span>
            </div>
            <div class="info-compact-item">
              <span class="info-compact-label">UUID:</span>
              <span class="info-compact-value">{{ connectedDevice.uuid }}</span>
            </div>
            <div v-for="([key, value], i) in Object.entries(connectedDevice.meta || {})" :key="i" class="info-compact-item">
              <span class="info-compact-label">{{ key }}:</span>
              <span class="info-compact-value">{{ value }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Controls Section -->
      <div class="controls-section">
        <div class="controls-row">
          <SmartSearch :options="fieldOptions" v-model="criteria" placeholder="Filter logs..." class="filter-search" />
          <BaseButton :class="{ 'enabled': autoscrollEnabled }" @click="toggleAutoScroll" title="Toggle autoscroll"
            class="autoscroll-button">
            <ChevronDoubleDownIcon class="auto-scroll-icon" />
            Auto-scroll
          </BaseButton>
        </div>
      </div>

      <!-- Logs List -->
      <div class="logs-section">
        <div class="logs-header">
          <h3 class="section-title">Live Log Stream</h3>
          <span class="logs-count" v-if="filteredLogs.length > 0">{{ filteredLogs.length }} events</span>
        </div>
        <div class="logs-list-container">
          <VList ref="virtualListRef" class="logs-list" :data="filteredLogs" @scroll="handleScroll">
            <template #default="{ item }">
              <div class="log-card-container">
                <LogCard :log="item" :key="item.id" @search="addSearchCriterion" />
              </div>
            </template>
          </VList>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { wsStreams } from '@/api/wsStreams';
import LogCard from '@/components/base/LogCard.vue';
import { eventMessageFromJson, type EventMessage } from '@/model/event/eventMessage';
import { WifiIcon, DevicePhoneMobileIcon, ChevronDoubleDownIcon } from '@heroicons/vue/24/outline';
import { WebsocketClient, type ConnectionStatus } from '@/websocketClient/websocketClient';
import { applications, type ConnectedDevice } from '@/api/applications';
import BaseButton from '@/components/base/BaseButton.vue';
import BaseLoader from '@/components/base/BaseLoader.vue';
import SmartSearch from '@/components/base/smartSearch/SmartSearch.vue';
import { fieldOptions } from '@/components/base/smartSearch/searchCriterions';
import PageHeader from '@/components/base/PageHeader.vue';
import { SearchCriterion } from '@/components/base/smartSearch/types';
import { filterLogs } from '@/utils/logFilter';
import { VList } from 'virtua/vue';

const route = useRoute();
const router = useRouter();
const deviceUuid = route.params.uuid as string;
let webUuid: string | null = null;

const virtualListRef = ref<InstanceType<typeof VList> | null>(null);
const isAtBottom = ref(true);
const logs = ref<EventMessage[]>([]);
const deviceConnected = ref(true);
const connectedDevice = ref<ConnectedDevice | null>(null);
const autoscrollEnabled = ref(true);
const criteria = ref<SearchCriterion[]>([]);
const isLoading = ref(true);

let wsClient: WebsocketClient | null = null;
const connectionStatus = ref<ConnectionStatus>('closed');

// Computed property for filtered logs
const filteredLogs = computed(() => {
  return filterLogs(logs.value, criteria.value);
});



onMounted(async () => {
  await nextTick();
  scrollToBottom();
  initializeEventsStream();
});

onBeforeUnmount(async () => {
  try {
    if (webUuid && deviceConnected.value) {
      await wsStreams.stopLogs(webUuid, deviceUuid);
    }
  } catch { }
  wsClient?.disconnect();
});

watch(
  () => filteredLogs.value.length,
  async () => {
    if (!autoscrollEnabled.value) return;
    await nextTick();

    if (isAtBottom.value) {
      // Автоматическая прокрутка вниз только если пользователь у низа
      scrollToBottom();
    }
  }
)

async function initializeEventsStream() {
  isLoading.value = true;
  const deviceResult = await applications.getOnlineDevice(deviceUuid);
  if (deviceResult.isLeft()) {
    console.error(deviceResult.value);
    deviceConnected.value = false;
    isLoading.value = false;
  } else {
    connectedDevice.value = deviceResult.value.result.device;
    // ensure websocket is open before requesting start
    const ensureOpen = async () => {
      const maxWait = 3000;
      const start = Date.now();
      while (connectionStatus.value !== 'open' && Date.now() - start < maxWait) {
        await new Promise(r => setTimeout(r, 50));
      }
      return connectionStatus.value === 'open';
    };
    wsClient = new WebsocketClient(async (message) => {
      try {
        const msg = JSON.parse(message);
        if (msg) {
          if (msg.type === 3 && msg.payload) {
            logs.value = [...logs.value, eventMessageFromJson(msg.payload)];
          } else if (msg.type === 2 && msg.payload) {
            if (webUuid == null) {
              webUuid = msg.payload as string;
              const startResult = await wsStreams.startLogs(webUuid, deviceUuid);
              if (startResult.isRight()) {
              } else {
                console.warn('Failed to start logs stream', startResult.value);
              }
            }
          } else if (msg.type === 5) {
            deviceConnected.value = false;
          }
        }

      } catch (e) {
        console.error(e);
      }
    }, (status) => { connectionStatus.value = status });
    wsClient.connect();
    const opened = await ensureOpen();
    if (!opened) console.warn('WebSocket not open!');
    isLoading.value = false;
  }

}

const addSearchCriterion = (criterion: SearchCriterion) => {
  criteria.value = [...criteria.value, criterion];
};


function scrollToBottom() {
  if (virtualListRef.value && filteredLogs.value.length > 0) {
    virtualListRef.value.scrollToIndex(filteredLogs.value.length - 1, { align: 'end' });
  }
}

function toggleAutoScroll() {
  if (!autoscrollEnabled.value) {
    scrollToBottom();
  }
  autoscrollEnabled.value = !autoscrollEnabled.value;
}

function handleScroll(offset: number) {
  if (!virtualListRef.value) return;

  const scrollElement = virtualListRef.value.$el as HTMLElement;
  if (!scrollElement) return;

  const threshold = 5;
  const distanceFromBottom = scrollElement.scrollHeight - offset - scrollElement.clientHeight;
  isAtBottom.value = distanceFromBottom <= threshold;
}


function goBack() {
  router.back();
}
</script>

<style scoped>
.online-log-stream {
  height: 100%;
  overflow-y: auto;
  background: var(--color-secondary);
}

.stream-container {
  height: 100%;
  box-sizing: border-box;
  max-width: 1600px;
  margin: 0 auto;
  padding: 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.status-indicators {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 20px;
  font-size: 0.875rem;
}

.ws-icon,
.device-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.ws-open {
  color: #10b981;
}

.ws-connection {
  color: #84cc16;
}

.ws-error,
.ws-closed {
  color: #ef4444;
}

.device-icon {
  color: #ef4444;
}

.device-connected {
  color: #10b981;
}

.status-text {
  text-transform: capitalize;
  font-weight: 500;
  color: var(--color-text);
}

/* Device Info Section */
.device-info-section {
  background: white;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 0.875rem 1rem;
}

.device-info-content {
  display: flex;
  flex-direction: column;
}

.info-compact-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.5rem;
  align-items: center;
}

.info-compact-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.info-compact-label {
  font-weight: 600;
  color: var(--color-text-dimmed);
  white-space: nowrap;
}

.info-compact-value {
  color: var(--color-text);
  word-break: break-all;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
}

/* Controls Section */
.controls-section {
  background: white;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 0.75rem 1rem;
}

.controls-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.autoscroll-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.autoscroll-button.enabled {
  background-color: #10b981;
}

.auto-scroll-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.filter-search {
  flex: 1;
  min-width: 0;
}

/* Logs Section */
.logs-section {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-title {
  margin: 0;
}

.logs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.25rem;
}

.logs-count {
  font-size: 0.875rem;
  color: var(--color-text-dimmed);
  font-weight: 500;
}

.logs-list-container {
  background: white;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
  flex: 1;
}

.logs-list {
  height: 100%;
  width: 100%;
  padding: 1rem;
  box-sizing: border-box;
}

.log-card-container {
  margin-bottom: 0.5rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .stream-container {
    padding: 1rem;
    gap: 0.75rem;
  }

  .status-indicators {
    width: 100%;
    flex-direction: column;
  }

  .status-badge {
    width: 100%;
    justify-content: center;
  }

  .info-compact-row {
    gap: 0.5rem 1rem;
  }

  .info-compact-value {
    max-width: 200px;
  }

  .controls-row {
    flex-direction: column;
    gap: 0.75rem;
  }

  .autoscroll-button {
    width: 100%;
    justify-content: center;
  }

  .filter-search {
    width: 100%;
  }
}

/* Smooth transitions */
* {
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}
</style>
