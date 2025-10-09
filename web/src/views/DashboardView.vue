<template>
  <div class="dashboard">
    <DashboardAppBar />
    <div class="page-content">
      <DashboardSidebar @update:active="activeMenu = $event" />
      <main class="content">
        <UserList v-if="activeMenu == SidebarItemEnum.users" />
        <ApplicationsList v-if="activeMenu == SidebarItemEnum.apps" />
        <LogsList v-if="activeMenu == SidebarItemEnum.logs" />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import DashboardAppBar from '@/components/DashboardAppBar.vue';
import DashboardSidebar from '@/components/DashboardSidebar.vue';
import UserList from '@/components/UsersList.vue';
import ApplicationsList from '@/components/ApplicationsList.vue';
import LogsList from '@/components/logs/LogsList.vue';
import { ref } from 'vue';
import { SidebarItemEnum } from '@/model/sidebarItemEnum';
import { useAppStateStore } from '@/stores/appStateStore';

const appStateStore = useAppStateStore();

const activeMenu = ref<SidebarItemEnum>(appStateStore.page ?? SidebarItemEnum.logs);

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