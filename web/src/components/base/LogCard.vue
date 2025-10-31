<template>
  <div :class="['log-card', 'log-message', log.logLevel, { expanded }]">
    <section class="log-part-card">
      <ChevronRightIcon v-show="!expanded" @click="toggle" class="expand-chevron" />
      <ChevronDownIcon v-show="expanded" @click="toggle" class="expand-chevron" />
      <div class="timestamp">{{ formatDate(log.timestamp) }}</div>
      <span :class="{ 'log-text': true, 'expanded': expanded }">{{ log.message }}</span>
      <LogLevelBadge :level="log.logLevel" />
    <a v-if="showLink" class="log-link-icon" :href="logUrl" :title="'Permanent link'">
      <LinkIcon class="icon-link" />
    </a>
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
import { ChevronDownIcon, ChevronRightIcon, DevicePhoneMobileIcon, ArrowDownOnSquareIcon, ComputerDesktopIcon, TagIcon, CodeBracketIcon, LinkIcon } from '@heroicons/vue/24/outline';
import { ref, computed } from 'vue';
import { SearchFieldKey, SearchCriterion, Operator } from '@/components/base/smartSearch/types';
import { useRouterUtils } from '@/utils/routerUtils';

const emit = defineEmits<{
  (e: 'search', criterion: SearchCriterion): void
}>();

const props = defineProps<{
  log: EventMessage,
  showLink?: boolean,
  defaultExpanded?: boolean,
}>();

const expanded = ref<boolean>(props.defaultExpanded ?? false);
const routerUtils = useRouterUtils();

const logUrl = computed(() => routerUtils.getEventLogSingleUrl(props.log.id));

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
  return new Date(ts).toLocaleString();
}

</script>

<style scoped>
.log-card {
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  background: var(--color-white);
  border-left: 4px solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border-subtle);
  transition: box-shadow var(--transition-base) var(--transition-ease), background-color var(--transition-base) var(--transition-ease), border-color var(--transition-base) var(--transition-ease);
}

.log-card.expanded {
  margin-bottom: var(--spacing-sm);
  background: var(--color-white);
  box-shadow: var(--box-shadow-sm);
  border-left-width: 4px;
}

.expand-enter-active,
.expand-leave-active {
  transition: all var(--transition-slow) var(--transition-ease);
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
  font-size: var(--font-size-base);
  color: var(--color-text-dimmed);
}

.log-part-card {
  display: flex;
  justify-content: start;
  align-items: start;
  padding: var(--spacing-lg);
  gap: var(--spacing-md);
}

.expand-chevron {
  cursor: pointer;
  width: var(--icon-size-sm);
  height: var(--icon-size-sm);
  margin-right: var(--spacing-sm);
  color: var(--color-text-dimmed);
}

.log-text {
  flex: 1;
  margin: 0 var(--spacing-lg);
  font-size: var(--font-size-lg);
  text-align: start;
  font-family: 'Courier New', Courier, monospace
}

.log-text.expanded {
  white-space: pre-wrap;
  word-break: break-word;
}

.log-card.log-message.info {
  background-color: var(--log-info-bg);
  border-left-color: var(--log-info);
  border-left-width: 4px;
}

.log-card.log-message.warn {
  background-color: var(--log-warn-bg);
  border-left-color: var(--log-warn);
  border-left-width: 4px;
}

.log-card.log-message.error {
  border-left-color: var(--log-error);
  border-left-width: 4px;
  background-color: var(--log-error-bg);
}

.log-card.log-message.crash {
  border-color: #dc2626;
  border-left-color: #991b1b;
  border-left-width: 5px;
  background-color: var(--log-crash-bg);
  border-width: 1px 1px 1px 5px;
}

.log-card.log-message.debug {
  border-left-color: var(--log-debug);
  border-left-width: 4px;
  background-color: var(--log-debug-bg);
}

.logs-extra-info {
  display: flex;
  flex-direction: column;
  padding: 0 var(--spacing-lg) var(--spacing-lg) var(--spacing-lg);
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-sm);
  border-top: 1px solid var(--color-border-subtle);
  padding-top: var(--spacing-lg);
}

.row {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: space-between;
  gap: var(--spacing-lg);
}

.extra-info-block {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  flex: 1;
}

.extra-info-header {
  display: flex;
  flex-direction: row;
  align-items: end;
}

.extra-info-header svg {
  width: var(--icon-size-md);
  height: var(--icon-size-md);
  margin-right: 0.3rem;
  vertical-align: middle;
}

.extra-info-body {
  padding: 0.875rem;
  border-radius: var(--border-radius-md);
  background-color: var(--color-background-light);
  border: 1px solid var(--color-border-extra-light);
}

.detail {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.detail .detail-label {
  margin-right: var(--spacing-sm);
  color: var(--color-text-dimmed);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  align-items: center;
}

.stack-trace {
  text-align: start;
  margin: 0;
}

.log-link-icon {
  margin-left: var(--spacing-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
}
.icon-link {
  width: var(--icon-size-sm);
  height: var(--icon-size-sm);
  opacity: 0.7;
  transition: opacity var(--transition-base);
}
.icon-link:hover {
  opacity: 1;
  color: var(--log-info);
}
</style>