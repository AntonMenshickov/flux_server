<template>
  <div class="dashboard">
    <DashboardAppBar />
    <div class="page-content">
      <DashboardSidebar />
      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import DashboardAppBar from '@/components/DashboardAppBar.vue';
import DashboardSidebar from '@/components/DashboardSidebar.vue';
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