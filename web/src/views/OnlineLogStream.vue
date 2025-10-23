<template>
  <div class="online-log-stream">
    <div class="stream-header">
      <ArrowLeftIcon @click="goBack" class="back-button" />
      <span class="device-id">{{ connectedDevice?.deviceName }} ({{ connectedDevice?.deviceId }})</span>
    </div>
    <div class="row">
      <div class="device-info">
        <span :title="`Websocket ${connectionStatus}`">
          <WifiIcon :class="'ws-status ws-' + connectionStatus" />
        </span>
        <span :title="deviceConnected ? 'Device online' : 'Device offline'">
          <DevicePhoneMobileIcon :class="{ 'device-status': true, 'device-connected': deviceConnected }" />
        </span>
        <div v-if="connectedDevice" class="device-item">
          <div class="device-name">{{ connectedDevice.deviceName }} {{ connectedDevice.deviceId }}</div>
          <div class="device-params">{{ connectedDevice.platform }} • {{ connectedDevice.osName }} • {{
            connectedDevice.bundleId }} • {{ connectedDevice.uuid }}</div>

        </div>
        <div v-if="connectedDevice" class="device-meta">
          <div class="meta-values">
            <div v-for="([key, value], i) in Object.entries(connectedDevice.meta)" :key="i" class="meta-item">
              <span class="meta-key">{{ key }}</span>
              <span class="meta-value">{{ value }}</span>
            </div>
          </div>
        </div>
      </div>
      <BaseButton :class="{ 'enabled': autoscrollEnabled }" @click="toggleAutoScroll" title="Toggle autoscroll">
        <ChevronDoubleDownIcon class="auto-scroll-icon" />
      </BaseButton>
    </div>
    <div class="filter-section">
      <SmartSearch :options="fieldOptions" v-model="criteria" placeholder="Filter logs..." />
    </div>
    <div class="logs-list-container">
      <VList ref="virtualListRef" class="logs-list" :data="filteredLogs" @scroll="handleScroll">
        <template #default="{ item }">
          <LogCard :log="item" :key="item.id" @search="addSearchCriterion"/>
        </template>
      </VList>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { wsStreams } from '@/api/wsStreams';
import LogCard from '@/components/base/LogCard.vue';
import { eventMessageFromJson, type EventMessage } from '@/model/event/eventMessage';
import { ArrowLeftIcon, WifiIcon, DevicePhoneMobileIcon, ChevronDoubleDownIcon } from '@heroicons/vue/24/outline';
import { WebsocketClient, type ConnectionStatus } from '@/websocketClient/websocketClient';
import { applications, type ConnectedDevice } from '@/api/applications';
import BaseButton from '@/components/base/BaseButton.vue';
import SmartSearch from '@/components/base/smartSearch/SmartSearch.vue';
import { fieldOptions } from '@/components/base/smartSearch/searchCriterions';
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
  const deviceResult = await applications.getOnlineDevice(deviceUuid);
  if (deviceResult.isLeft()) {
    console.error(deviceResult.value);
    deviceConnected.value = false;
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
  display: flex;
  flex-direction: column;
}

.stream-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 1.5rem;
  margin-bottom: 1rem;
  margin-top: 1rem;
}

.back-button {
  width: 2rem;
  height: 2rem;
  cursor: pointer;
}

.device-id {
  display: inline-block;
  max-width: 600px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-left: 1rem;
  font-size: 2rem;
}

.ws-status {
  width: 2rem;
  height: 2rem;
}

.ws-connection {
  color: yellowgreen;
}

.ws-open {
  color: green;
}

.ws-error,
.ws-closed {
  color: red;
}

.device-status {
  width: 2rem;
  height: 2rem;
  margin-left: 0.5rem;
  color: red;
}

.device-connected {
  color: green;
}

.row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin: 0 1rem;
}

.device-info {
  display: flex;
  flex-direction: row;
  align-items: end;
}

.device-item {
  margin-left: 0.5rem;
  background: var(--color-secondary);
  text-align: start;
}

.device-name {
  font-weight: 600;
  font-size: 1rem;
}

.device-params {
  color: var(--color-text-dimmed, #888);
  font-size: 0.85rem;
}

.device-meta {
  display: flex;
  flex-direction: row;
  justify-content: start;
  margin-left: 2rem;
  max-height: 2rem;
  overflow-y: auto;
}

.meta-values {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 2px 1rem;
  text-align: start;
}

.meta-item {
  display: contents;
}

.meta-key {
  font-weight: bold;
  font-size: 0.85rem;
}

.meta-value {
  color: var(--color-text-dimmed, #888);
  font-size: 0.85rem;
}

.enabled {
  background-color: green;
}

.auto-scroll-icon {
  width: 1rem;
  height: 1rem;
  color: white;
}

.filter-section {
  margin: 1rem;
}

.logs-list-container {
  flex: 1;
  overflow: hidden;
  margin: 1rem;
  margin-top: 0.5rem;
  border-radius: var(--border-radius);
  border: 1px solid var(--color-border);
  background-color: white;
}

.logs-list {
  height: 100%;
  width: 100%;
  padding: 1rem;
  box-sizing: border-box;
}
</style>
