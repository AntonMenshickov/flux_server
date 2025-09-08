<template>
  <div class="dashboard-app-bar">
    <div class="logo">
      <img src="../assets/logo_on_dark.svg" alt="Logo" />
    </div>
    <span class="page-name">Dashboard</span>
    <div class="profile-options">
      <div class="profile-name">
        <UserCircleIcon class="profile-options-icon" />Welcome, {{ userName() }}
      </div>
      <ArrowLeftEndOnRectangleIcon class="profile-options-icon logout-icon" @click="doLogout" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeftEndOnRectangleIcon, UserCircleIcon } from '@heroicons/vue/24/outline';
import { useUserStore } from '@/stores/user';
import router from '@/router';

const userStore = useUserStore();

function userName() {
  return userStore.profile?.login || 'Guest';
}

function doLogout() {
  userStore.logout();
  router.push({ path: '/' });
}
</script>

<style scoped>
.dashboard-app-bar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75em 0.75em;
  background-color: var(--color-primary);
  border-bottom: 1px solid #ddd;
  color: var(--color-secondary);
}

.logo img {
  height: 2em;
}

.page-name {
  position: absolute;
  left: 250px;
  right: 0;
  margin-inline: auto;
  font-size: 1.25em;
  font-weight: bold;
}

.profile-options-icon {
  width: 1.5em;
  height: 1.5em;
}

.profile-name {
  font-size: 1em;
  display: flex;
  align-items: center;
  gap: 0.5em;
}

.logout-icon {
  width: 24px;
  height: 24px;
  cursor: pointer;
}

.logout-icon:hover {
  color: var(--color-accent);
}

.profile-options {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1em;
}
</style>