<template>
  <div class="online-devices-panel">
    <button class="online-devices-toggle" @click="open = !open">
      Online devices ({{ devices.length }})
      <span :class="['arrow', open ? 'open' : '']">▼</span>
    </button>
    <transition name="fade">
      <ul v-if="open && devices.length" class="devices-list">
        <li v-for="(d, idx) in devices" :key="idx" class="device-item">
          <div class="device-name">{{ d.deviceName }} {{ d.deviceId }}</div>
          <div class="device-meta">{{ d.platform }} • {{ d.osName }} • {{ d.bundleId }}</div>
        </li>
        <li v-if="!devices.length" class="device-item device-empty">No devices online</li>
      </ul>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { applications, type ConnectedDevice } from '@/api/applications';

const props = defineProps<{ applicationId: string | null }>();

const devices = ref<ConnectedDevice[]>([]);
const open = ref(false);


async function load(id: string | null) {
  if (!id) { devices.value = []; return; }
  const resp = await applications.getConnectedDevices(id);
  if (resp.isRight()) {
    devices.value = resp.value.result.devices ;
  } else {
    devices.value = [];
  }
}

onMounted(() => load(props.applicationId));
watch(() => props.applicationId, (v) => load(v));
</script>

<style scoped>
/* Online devices panel styles */
.online-devices-panel {
  position: relative;
  margin-left: 1rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 220px;
}

.online-devices-toggle {
  background: #f1f5f9;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.4rem 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.arrow {
  display: inline-block;
  transition: transform 0.2s;
}

.arrow.open {
  transform: rotate(180deg);
}

.devices-list {
  max-height: 10px;
  overflow-y: auto;
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 180px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  background-color: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
}

.device-item {
  padding: 0.25rem;
  border-radius: 4px;
  background: #f8fafc;
}

.device-empty {
  color: #888;
  font-style: italic;
}

.device-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.device-meta {
  color: var(--color-text-dimmed, #888);
  font-size: 0.85rem;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
