<template>
  <div :class="['log-card', 'log-message', log.logLevel, { expanded }]">
    <section class="log-part-card">
      <ChevronRightIcon v-show="!expanded" @click="toggle" class="expand-chevron" />
      <ChevronDownIcon v-show="expanded" @click="toggle" class="expand-chevron" />
      <div class="timestamp">{{ formatDate(log.timestamp) }}</div>
      <span :class="{ 'log-text': true, 'expanded': expanded }">{{ log.message }}</span>
      <LogLevelBadge :level="log.logLevel" />
    </section>

    <transition name="expand">
      <section v-if="expanded" class="logs-extra-info">
        <section v-if="log.stackTrace" class="extra-info-block">
          <div class="extra-info-header">
            <CodeBracketIcon /> StackTrace
          </div>
          <div class="extra-info-body">
            <pre class="stack-trace">{{ log.stackTrace }}</pre>

          </div>
        </section>

        <div class="row">
          <section class="extra-info-block">
            <div class="extra-info-header">
              <DevicePhoneMobileIcon /> Device information
            </div>
            <div class="extra-info-body">
              <div class="detail"><span class="detail-label">Device name:</span>
                <BaseCopyText @click="emitSearch(SearchFieldKey.DeviceName, log.deviceName ?? '')">{{ log.deviceName }}</BaseCopyText>
              </div>
              <div class="detail"><span class="detail-label">Device ID:</span>
                <BaseCopyText @click="emitSearch(SearchFieldKey.DeviceId, log.deviceId ?? '')">{{ log.deviceId }}</BaseCopyText>
              </div>
              <div class="detail"><span class="detail-label">OS name:</span>
                <BaseCopyText @click="emitSearch(SearchFieldKey.OsName, log.osName ?? '')">{{ log.osName }}</BaseCopyText>
              </div>

            </div>
          </section>

          <section class="extra-info-block">
            <div class="extra-info-header">
              <ArrowDownOnSquareIcon />Application information
            </div>
            <div class="extra-info-body">
              <div class="detail"><span class="detail-label">Bundle:</span>
                <BaseCopyText @click="emitSearch(SearchFieldKey.BundleId, log.bundleId)">{{ log.bundleId }}</BaseCopyText>
              </div>
              <div class="detail"><span class="detail-label">Platform:</span>
                <BaseCopyText @click="emitSearch(SearchFieldKey.Platform, log.platform)">{{ log.platform }}</BaseCopyText>
              </div>
            </div>
          </section>

          <section class="extra-info-block">
            <div class="extra-info-header">
              <ComputerDesktopIcon />Meta information
            </div>
            <div class="extra-info-body">
              <div v-for="[key, value] in log.meta" :key="key" class="detail"><span class="detail-label">{{ key
                  }}</span>
                <BaseCopyText @click="emitSearch(SearchFieldKey.Meta, { key, value })">{{ value }}</BaseCopyText>
              </div>
            </div>
          </section>
        </div>

        <section v-if="log.tags?.length" class="extra-info-block">
          <div class="extra-info-header">
            <TagIcon />Tags
          </div>
          <div v-if="log.tags && log.tags.length > 0" class="tags">
            <TagBadge v-for="tag in log.tags" :key="tag" :label="tag" @click="emitSearch(SearchFieldKey.Tags, tag)" />
          </div>
        </section>
      </section>
    </transition>
  </div>
</template>


<script setup lang="ts">
import TagBadge from '@/components/base/TagBadge.vue';
import LogLevelBadge from '@/components/base/LogLevelBadge.vue';
import BaseCopyText from '@/components/base/BaseCopyText.vue';
import type { EventMessage } from '@/model/event/eventMessage';
import { ChevronDownIcon, ChevronRightIcon, DevicePhoneMobileIcon, ArrowDownOnSquareIcon, ComputerDesktopIcon, TagIcon, CodeBracketIcon } from '@heroicons/vue/24/outline';
import { ref } from 'vue';
import { SearchFieldKey, SearchCriterion, Operator } from '@/components/base/smartSearch/types';

const emit = defineEmits<{
  (e: 'search', criterion: SearchCriterion): void
}>();

defineProps<{
  log: EventMessage
}>();

const expanded = ref<boolean>(false);

function toggle() {
  expanded.value = !expanded.value;
}

function emitSearch(field: SearchFieldKey, value: string | { key: string; value: string }) {
  if (field === SearchFieldKey.Meta && typeof value === 'object') {
    emit('search', new SearchCriterion(field, Operator.Equals, [{ [value.key]: value.value }]));
  } else if (typeof value === 'string') {
    emit('search', new SearchCriterion(field, Operator.Equals, value));
  }
}

function formatDate(ts: number) {
  return new Date(ts / 1000).toLocaleString();
}
</script>

<style scoped>
.log-card {
  margin-bottom: 0.2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: #f9f9f9;
  border-left: 3px solid #ccc;
  border-radius: 4px;
  transition: box-shadow 0.2s ease, background-color 0.2s ease;
}

.log-card.expanded {
  margin-bottom: 0.4rem;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  border-left-width: 4px;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 1000px;
  opacity: 1;
}

.timestamp {
  font-size: 0.9rem;
  color: var(--color-text-dimmed);
}

.log-part-card {
  display: flex;
  justify-content: start;
  align-items: start;
  padding: 0.5rem;

}

.expand-chevron {
  cursor: pointer;
  width: 1rem;
  height: 1rem;
  margin-right: 0.5rem;
  color: var(--color-text-dimmed);
}

.log-text {
  flex: 1;
  margin: 0 1rem;
  font-size: 1rem;
  text-align: start;
  font-family: 'Courier New', Courier, monospace
}

.log-text.expanded {
  white-space: pre-wrap;
  word-break: break-word;
}

.log-card.log-message.info {
  background-color: rgba(2, 132, 199, 0.078);
  border-left-color: rgba(2, 132, 199, 0.2);
}

.log-card.log-message.warn {
  background-color: rgba(199, 146, 2, 0.078);
  border-left-color: rgba(199, 146, 2, 0.2);
}

.log-card.log-message.error {
  border-left-color: rgba(255, 0, 0, 0.2);
  background-color: rgba(255, 0, 0, 0.078);
}

.log-card.log-message.crash {
  border-top: 1px solid;
  border-bottom: 1px solid;
  border-right: 1px solid;
  border-color: rgba(138, 0, 0, 0.2);
  border-left-color: rgba(138, 0, 0, 0.4);
  background-color: rgba(255, 0, 0, 0.078);
}

.log-card.log-message.debug {
  border-left-color: rgba(163, 111, 173, 0.2);
  background-color: rgba(163, 111, 173, 0.1);
}

.logs-extra-info {
  display: flex;
  flex-direction: column;
  padding-bottom: 1rem;
  gap: 1rem;
  padding: 0 1.5rem;
  margin-bottom: 1rem;
}

.row {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: space-between;
  gap: 1rem;
}

.extra-info-block {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.extra-info-header {
  display: flex;
  flex-direction: row;
  align-items: end;
}

.extra-info-header svg {
  width: 1.2rem;
  height: 1.2rem;
  margin-right: 0.3rem;
  vertical-align: middle;
}

.extra-info-body {
  padding: 1rem;
  border-radius: var(--border-radius);
  background-color: #ffffff55;
}

.detail {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.detail .detail-label {
  margin-right: 0.5rem;
  color: #8a8a8a;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.stack-trace {
  text-align: start;
  margin: 0;
}
</style>