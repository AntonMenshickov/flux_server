<template>
  <div class="online-log-stream">
    <div class="stream-header">
      <ArrowLeftIcon @click="goBack" class="back-button" />
      <span class="device-id">Device: {{ deviceUuid }}</span>
      <span class="ws-status">
        <WifiIcon :class="'ws-' + connectionStatus" />
      </span>
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
import { ArrowLeftIcon, WifiIcon } from '@heroicons/vue/24/outline';

const route = useRoute();
const router = useRouter();
const deviceUuid = route.params.uuid as string;
let webUuid: string | null = null;

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

});

onBeforeUnmount(async () => {
  scrollContainer.value?.removeEventListener('scroll', handleScroll)
  try {
    if (webUuid) {
      await wsStreams.stopLogs(webUuid, deviceUuid);
    }
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
  ws = new WebSocket(wsUrl);
  ws.onopen = () => {
    console.log('Ws open');
    connectionStatus.value = 'open';
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };
  ws.onmessage = async (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      if (msg) {
        if (msg.type === 3 && msg.payload) {
          logs.value = [...logs.value, msg.payload];
        } else if (msg.type === 2 && msg.payload) {
          if (webUuid == null) {
            webUuid = msg.payload as string;
            const startResult = await wsStreams.startLogs(webUuid, deviceUuid);
            if (startResult.isRight()) {
            } else {
              console.warn('Failed to start logs stream', startResult.value);
            }
          }
        }
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
  margin-bottom: 1rem;
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
  width: 2rem;
  height: 2rem;
  margin-left: 1rem;
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

.logs-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  padding-top: 0;
}
</style>
