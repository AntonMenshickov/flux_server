<template>
  <div class="dashboard-app-bar">
    <div class="logo">
      <img :src="logoOnDark" alt="Logo" />
    </div>
    <span class="page-name">Dashboard</span>
    <div class="profile-options">
      <ThemeToggle />
      <div class="profile-name">
        <UserCircleIcon class="profile-options-icon" />Welcome, {{ userName() }}
      </div>
      <ArrowLeftEndOnRectangleIcon class="profile-options-icon logout-icon" @click="doLogout" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeftEndOnRectangleIcon, UserCircleIcon } from '@heroicons/vue/24/outline';
import { useUserStore } from '@/stores/userStore';
import { useRouterUtils } from '@/utils/routerUtils';
import ThemeToggle from '@/components/ThemeToggle.vue';
import logoOnDark from '@/assets/logo_on_dark.svg';

const userStore = useUserStore();
const routerUtils = useRouterUtils();


function userName() {
  return userStore.profile?.login || 'Guest';
}

function doLogout() {
  userStore.logout();
  routerUtils.navigateToHome();
}
</script>

<style scoped>
.dashboard-app-bar {
  z-index: var(--z-index-appbar);
  position: fixed;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75em 0.75em;
  background-color: var(--color-primary);
  border-bottom: 1px solid var(--color-border-light);
  color: var(--color-white);
  box-sizing: border-box;
}

.logo img {
  height: 2em;
}

.page-name {
  position: absolute;
  left: var(--sidebar-width);
  right: 0;
  margin-inline: auto;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
}

.profile-options-icon {
  width: var(--icon-size-xl);
  height: var(--icon-size-xl);
}

.profile-name {
  font-size: var(--font-size-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
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
  gap: var(--spacing-lg);
}
</style>