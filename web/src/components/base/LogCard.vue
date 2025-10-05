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
        <section v-if="log.stackTrace" class="stack-trace">
          <strong>Stack Trace:</strong>
          <pre>{{ log.stackTrace }}</pre>
        </section>

        <section class="log-details">
          <div class="detail"><strong>Platform:</strong>
            <BaseCopyText>{{ log.platform }}</BaseCopyText>
          </div>
          <div class="detail"><strong>Bundle:</strong>
            <BaseCopyText>{{ log.bundleId }}</BaseCopyText>
          </div>
          <div class="detail"><strong>Device:</strong>
            <BaseCopyText>{{ log.deviceId }}</BaseCopyText>
          </div>
          <div class="detail"><strong>Device name:</strong>
            <BaseCopyText>{{ log.deviceName }}</BaseCopyText>
          </div>
          <div class="detail"><strong>OS name:</strong>
            <BaseCopyText>{{ log.osName }}</BaseCopyText>
          </div>
        </section>

        <section class="tags-meta">
          <div v-if="log.tags && log.tags.length > 0" class="tags">
            <strong>Tags:</strong>
            <TagBadge v-for="tag in log.tags" :key="tag" :label="tag" />
          </div>
          <div v-if="log.meta && log.meta.size > 0" class="meta">
            <strong>Meta:</strong>
            <div v-for="[key, value] in log.meta" :key="key" class="meta-values">
              <div>
                <BaseCopyText>{{ key }}</BaseCopyText>:
              </div>
              <div>
                <BaseCopyText>{{ value }}</BaseCopyText>
              </div>
            </div>
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
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/vue/24/outline';
import { ref } from 'vue';

defineProps<{
  log: EventMessage
}>();

const expanded = ref<boolean>(false);

function toggle() {
  expanded.value = !expanded.value;
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
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
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
  color: #8a8a8a;
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
  color: #888;
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
  border-left-color: #ff000033;
  background-color: #ff000014;
}

.log-card.log-message.debug {
  border-left-color: rgb(163, 111, 173);
  background-color: rgba(163, 111, 173, 0.1);
}

.logs-extra-info {
  display: flex;
  flex-direction: column;
  padding-bottom: 1rem;
  gap: 1rem;
}

.stack-trace {
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: start;
  padding: 0 1rem;
}


.log-details {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  padding: 0 1rem;
  gap: 0.4rem 1rem;
  text-align: start;
  font-size: 0.9rem;
  color: #444;
}

.tags-meta {
  display: flex;
  flex-wrap: wrap;
  padding: 0 1rem;
  gap: 1rem;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.meta {
  font-size: 0.85rem;
  text-align: start;
}

.meta .meta-values {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  margin: 0.3rem 0 0;
}
</style>