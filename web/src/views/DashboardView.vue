<template>
  <div class="dashboard">
    <DashboardAppBar />
    <div class="page-content">
      <DashboardSidebar @update:active="activeMenu = $event" />
      <main class="content">
        <UserList v-if="activeMenu === 'users'" />
        <ApplicationsList v-if="activeMenu === 'apps'" />
        <div v-if="activeMenu === 'logs'" />
        <div v-if="activeMenu === 'settings'" />
      </main>
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import DashboardAppBar from '@/components/DashboardAppBar.vue';
import DashboardSidebar from '@/components/DashboardSidebar.vue';
import UserList from '@/components/UsersList.vue';
import ApplicationsList from '@/components/ApplicationsList.vue';

@Options({
  components: {
    DashboardAppBar,
    DashboardSidebar,
    UserList,
    ApplicationsList,
  },
})
export default class DashboardView extends Vue {
  activeMenu = 'logs';
}
</script>
<style scoped>
.dashboard {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  padding: 1rem;
}

.page-content {
  display: flex;
  flex-direction: row;
  flex: auto;
}
</style>