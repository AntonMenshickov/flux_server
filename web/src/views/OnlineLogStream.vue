<template>
  <div class="online-log-stream">
    <div class="stream-header">
      <ArrowLeftIcon @click="goBack" class="back-button" />
      <span class="device-id">Device: {{ uuid }}</span>
      <span class="ws-status">WS: <span :class="'ws-' + connectionStatus">{{ connectionStatus }}</span></span>
    </div>
    <div ref="scrollContainer" class="logs-list">
      <LogCard v-for="(log, index) in logs" :key="index" :log="log" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { wsStreams } from '@/api/wsStreams';
import { CONFIG } from '@/config';
import { useUserStore } from '@/stores/userStore';
import LogCard from '@/components/base/LogCard.vue';
import type { EventMessage } from '@/model/event/eventMessage';
import { ArrowLeftIcon } from '@heroicons/vue/24/outline';

const route = useRoute();
const router = useRouter();
const uuid = route.params.uuid as string;

const scrollContainer = ref<HTMLElement | null>(null)
const isAtBottom = ref(true)
const logs = ref<EventMessage[]>([]);
let ws: WebSocket | null = null;
let reconnectTimer: number | null = null;
const connectionStatus = ref<'connecting' | 'open' | 'closed' | 'error'>('closed');
let forceDisconnect = false;


onMounted(async () => {
  const el = scrollContainer.value
  el?.addEventListener('scroll', handleScroll)
  nextTick(() => (el!.scrollTop = el!.scrollHeight))

  const userStore = useUserStore();
  const tokenStr = userStore.token?.accessToken ?? '';
  setupWebSocket(tokenStr);
  // ensure websocket is open before requesting start
  const ensureOpen = async () => {
    const maxWait = 3000;
    const start = Date.now();
    while (ws && ws.readyState !== WebSocket.OPEN && Date.now() - start < maxWait) {
      await new Promise(r => setTimeout(r, 50));
    }
    return ws && ws.readyState === WebSocket.OPEN;
  };
  const opened = await ensureOpen();
  if (!opened) console.warn('WebSocket not open before startLogs request; subscription may fail');
  const startResult = await wsStreams.startLogs(uuid);
  if (startResult.isRight()) {
  } else {
    console.warn('Failed to start logs stream', startResult.value);
  }
});

onBeforeUnmount(async () => {
  scrollContainer.value?.removeEventListener('scroll', handleScroll)
  try {
    await wsStreams.stopLogs(uuid);
  } catch { }
  forceDisconnect = true;
  if (ws) {
    ws.close();
    ws = null;
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
});

watch(
  () => logs.value.length,
  async () => {
    await nextTick()
    const el = scrollContainer.value
    if (!el) return

    if (isAtBottom.value) {
      // Автоматическая прокрутка вниз только если пользователь у низа
      el.scrollTop = el.scrollHeight
    }
  }
)


function setupWebSocket(tokenStr: string) {
  if (ws) return;
  const wsUrl = CONFIG.API_URL.replace(/^http/, 'ws') + '/ws?client=web&token=' + encodeURIComponent(tokenStr);
  connectionStatus.value = 'connecting';
  logs.value = [];
  ws = new WebSocket(wsUrl);
  ws.onopen = () => {
    console.log('Ws open');
    connectionStatus.value = 'open';
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };
  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      if (msg && msg.type === 0 && msg.payload) {
        logs.value = [...logs.value, msg.payload];
      }
    } catch (e) { console.error(e); }
  };
  ws.onclose = () => {
    console.log('Ws closed');
    connectionStatus.value = 'closed';
    ws = null;
    scheduleReconnect();
  };
  ws.onerror = (e) => {
    console.log('Ws error');
    connectionStatus.value = 'error';
    scheduleReconnect();
    console.error('Logs websocket error', e);
  };
}

function scheduleReconnect() {
  if (forceDisconnect) {
    if (reconnectTimer)
      clearTimeout(reconnectTimer)
    return;
  }
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    const userStore = useUserStore();
    const tokenStr = userStore.token?.accessToken ?? '';
    setupWebSocket(tokenStr);
  }, 2000);
}

function handleScroll() {
  const el = scrollContainer.value
  if (!el) return

  const threshold = 5 // пикселей допуска
  const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
  isAtBottom.value = distanceFromBottom <= threshold
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
  margin-bottom: 0;
  margin-top: 1rem;
}

.back-button {
  width: 2rem;
  height: 2rem;
  cursor: pointer;
}

.device-id {
  margin-left: 1rem;
  font-size: 2rem;
}

.ws-status {
  margin-left: 1rem;
}

.logs-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}
</style>
