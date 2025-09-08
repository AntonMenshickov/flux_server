<template>
  <div class="dashboard">
    <DashboardAppBar />
    <div class="page-content">
      <Sidebar @update:active="activeMenu = $event" />
      <main class="content">
        <UserList v-if="activeMenu === 'users'" />
        <div v-if="activeMenu === 'logs'" />
        <div v-if="activeMenu === 'settings'" />
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