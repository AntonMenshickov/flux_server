<template>
  <div class="dashboard-app-bar">
    <div class="logo">
      <img src="../assets/logo_on_dark.svg" alt="Logo" />
    </div>
    <span class="page-name">Dashboard</span>
    <div class="profile-options">
      <div class="profile-name">
        <UserCircleIcon class="profile-options-icon" />Welcome, {{ userName }}
      </div>
      <ArrowLeftEndOnRectangleIcon class="profile-options-icon logout-icon" @click="doLogout" />
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { ArrowLeftEndOnRectangleIcon, UserCircleIcon } from '@heroicons/vue/24/outline';
import { useUserStore } from '@/stores/user';
import router from '@/router';

@Options({
  components: {
    ArrowLeftEndOnRectangleIcon,
    UserCircleIcon
  },
})
export default class DashboardAppBar extends Vue {

  private userStore = useUserStore();

  get userName() {
    return this.userStore.profile?.login || 'Guest';
  }

  public doLogout() {
    this.userStore.logout();
    router.push({ path: '/' });
  }
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

.logo img{
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
  display: flex;
  align-items: center;
  gap: 1em;
}
</style>