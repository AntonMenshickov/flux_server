<template>
  <BasePage :isLoading="isLoading" loaderText="Loading event..." compact>
    <div v-if="accessDenied" class="access-denied">
      You are not allowed to view this event.
    </div>
    <div v-else-if="event" class="single-log-container">
      <PageHeader :title="'Event ' + event.id" @back="goBack" />
      <LogCard :log="event" :defaultExpanded="true" />
      <div class="open-in-list">
        <BaseButton @click="openInList" title="Open in application logs">Go to application logs</BaseButton>
      </div>
    </div>
  </BasePage>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BasePage from '@/components/base/BasePage.vue';
import PageHeader from '@/components/base/PageHeader.vue';
import LogCard from '@/components/base/LogCard.vue';
import BaseButton from '@/components/base/BaseButton.vue';
import { events } from '@/api/events';
import type { EventMessage } from '@/model/event/eventMessage';

const route = useRoute();
const router = useRouter();
const isLoading = ref(true);
const event = ref<EventMessage | null>(null);
const accessDenied = ref(false);

onMounted(async () => {
  const id = route.params.id as string;
  const res = await events.getById(id);
  if (res.isRight()) {
    event.value = res.value.result as unknown as EventMessage;
  } else {
    if (res.value.code === 403) {
      accessDenied.value = true;
    } else {
      alert(res.value.message);
    }
  }
  isLoading.value = false;
});

function goBack() {
  router.back();
}

function openInList() {
  if (!event.value) return;
  router.push({ name: 'event-logs', params: { applicationId: event.value.applicationId }, query: { focus: event.value.id } });
}
</script>

<style scoped>
.single-log-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.open-in-list {
  display: flex;
  justify-content: flex-end;
}

/* Access denied message */
.access-denied {
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: #fff5f5;
  color: #c53030;
}
</style>
