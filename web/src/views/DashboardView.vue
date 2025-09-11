<template>
  <div class="dashboard">
    <DashboardAppBar />
    <div class="page-content">
      <DashboardSidebar @update:active="activeMenu = $event" />
      <main class="content">
        <UserList v-if="activeMenu === 'users'" />
        <ApplicationsList v-if="activeMenu === 'apps'" />
        <LogsList v-if="activeMenu === 'logs'" />
        <div v-if="activeMenu === 'settings'" />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import DashboardAppBar from '@/components/DashboardAppBar.vue';
import DashboardSidebar from '@/components/DashboardSidebar.vue';
import UserList from '@/components/UsersList.vue';
import ApplicationsList from '@/components/ApplicationsList.vue';
import LogsList from '@/components/LogsList.vue';
import { ref } from 'vue';

const activeMenu = ref<string>('logs');

</script>
<style scoped>
.dashboard {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  margin-left: var(--sidebar-width);
  margin-top: var(--appbar-height);
}

.page-content {
  display: flex;
  flex-direction: row;
  flex: auto;
  height: 100%;
}
</style>