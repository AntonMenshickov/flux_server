<template>
  <div class="online-devices-panel">
    <div class="toggle-container" ref="dropdownRef">
      <div :class="['toggle-wrapper', { open }]" @click="openDevicesList">
        <transition name="fade" mode="out-in">
          <BaseInput v-if="open" ref="searchInputRef" v-model="search" class="online-devices-input"
            placeholder="Search online devices..." @input="debounceLoad" />
          <div v-else class="devices-count">
            Online devices ({{ deviceCount }})
            <span class="arrow">▼</span>
          </div>
        </transition>
      </div>
    </div>
    <transition name="fade">
      <ul v-if="open" class="devices-list">
        <li v-for="(d, idx) in devices" :key="idx" class="device-item" @click="() => select(d)">
          <div class="device-name">{{ d.deviceName }} {{ d.deviceId }}</div>
          <div class="device-meta">{{ d.platform }} • {{ d.osName }} • {{ d.bundleId }} • {{ d.uuid }}</div>
        </li>
        <li v-if="!devices.length" class="device-item device-empty">No devices online</li>
      </ul>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, watchEffect, onMounted, nextTick, onBeforeUnmount } from 'vue';
import { applications, type ConnectedDevice } from '@/api/applications';
import BaseInput from '../base/BaseInput.vue';

const props = defineProps<{ applicationId: string | null }>();

const devices = ref<ConnectedDevice[]>([]);
const deviceCount = ref(0);
const open = ref(false);
const search = ref<string>('');
const searchInputRef = ref<InstanceType<typeof BaseInput> | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);
let loadTimeout: number;
let refreshInterval: number;

const emit = defineEmits<{
  (e: 'update:select', value: ConnectedDevice): void
}>()

onMounted(() => {
  load(props.applicationId);
  loadDeviceCount(props.applicationId);
  refreshInterval = setInterval(() => {
    if (props.applicationId) loadDeviceCount(props.applicationId);
  }, 30000);
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  clearInterval(refreshInterval);
  document.removeEventListener('click', handleClickOutside);
});


watchEffect(() => {
  if (open.value && searchInputRef.value?.$el) {
    nextTick(() => {
      const input = searchInputRef.value?.$el;
      if (input) input.focus();
    });
  }
});

function select(device: ConnectedDevice) {
  emit('update:select', device);
} 

function openDevicesList() {
  open.value = true;
  search.value = '';
  loadDeviceCount(props.applicationId);
  load(props.applicationId);
}

async function load(id: string | null) {
  if (!id) { devices.value = []; return; }
  const resp = await applications.searchOnlineDevices(id, search.value);
  if (resp.isRight()) {
    devices.value = resp.value.result.devices;
  } else {
    devices.value = [];
  }
}

async function loadDeviceCount(id: string | null) {
  if (!id) { deviceCount.value = 0; return; }
  const resp = await applications.countOnlineDevices(id);
  if (resp.isRight()) {
    deviceCount.value = resp.value.result.count;
  } else {
    deviceCount.value = 0;
  }
}

function debounceLoad() {
  clearTimeout(loadTimeout);
  loadTimeout = setTimeout(() => load(props.applicationId), 300);
}

function handleClickOutside(event: MouseEvent) {
  if (!open.value) return;
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    open.value = false;
  }
}
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
  min-width: 250px;
  box-sizing: border-box;
}

.toggle-container {
  width: 100%;
}

.toggle-wrapper {
  background: #f1f5f9;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-wrapper.open {
  background: white;
}

.devices-count {
  box-sizing: border-box;
  min-height: 40px;
  padding: 0.4rem 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  user-select: none;
}

.online-devices-input {
  width: 100%;
  background: transparent;
  border: none !important;
  padding: 0.4rem 0.75rem;
  font-size: 0.9rem;
  outline: none;
}

.online-devices-input :deep(input) {
  border: none !important;
  background: transparent;
  padding: 0;
  font-weight: 500;
}

.toggle-wrapper:hover {
  border-color: #94a3b8;
}

.arrow {
  display: inline-block;
  transition: transform 0.2s;
}

.arrow.open {
  transform: rotate(180deg);
}

.devices-list {
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 270px;
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
  background: var(--color-secondary);
  cursor: pointer;
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
