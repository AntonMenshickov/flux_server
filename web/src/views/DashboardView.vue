<template>
  <div class="dashboard">
    <DashboardAppBar />
    <div class="page-content">
      <Sidebar @update:active="activeMenu = $event" />
      <main class="content">
        <UserList v-if="activeMenu === 'users'" />
        <LogsList v-if="activeMenu === 'logs'" />
        <SettingsPanel v-if="activeMenu === 'settings'" />
      </main>
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import DashboardAppBar from '@/components/DashboardAppBar.vue';
import Sidebar from '@/components/Sidebar.vue';
import UserList from '@/components/UsersList.vue';

@Options({
  components: {
    DashboardAppBar,
    Sidebar,
    UserList,
  },
})
export default class DashboardView extends Vue {
  activeMenu = 'users';
}
</script>
<style scoped>
.content {
  flex: 1;
  padding: 1rem;
}
.page-content {
  display: flex;
  height: calc(100vh - 50px);
}
</style>