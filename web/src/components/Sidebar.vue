<template>
  <aside class="sidebar">
    <div class="logo">
      <img src="../assets/logo.svg" alt="Logo" />
    </div>

    <nav class="menu">
      <ul>
        <li v-if="showUsers" :class="{ active: activeItem === 'users' }" @click="setActive('users')">
          <UserIcon class="icon" />
          <span>Users</span>
        </li>
        <li :class="{ active: activeItem === 'logs' }" @click="setActive('logs')">
          <DocumentTextIcon class="icon" />
          <span>Logs</span>
        </li>
        <li :class="{ active: activeItem === 'settings' }" @click="setActive('settings')">
          <Cog6ToothIcon class="icon" />
          <span>Settings</span>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { UserIcon, DocumentTextIcon, Cog6ToothIcon } from '@heroicons/vue/24/outline';
import { useUserStore } from '@/stores/user';

@Options({
  components: {
    UserIcon,
    DocumentTextIcon,
    Cog6ToothIcon
  }
}
)
export default class Sidebar extends Vue {
  activeItem = 'users';

  private userStore = useUserStore();

  get showUsers() {
    return this.userStore.profile?.isOwner || false;
  }
  

  setActive(item: string) {
    this.activeItem = item;
    this.$emit('update:active', item);
  }
}
</script>

<style scoped>
.sidebar {
  width: 250px;
  height: 100vh;
  background-color: var(--color-primary);
  color: #fff;
  display: flex;
  flex-direction: column;
}


.logo {
  text-align: center;
  margin: 2em;
}

.logo img {
  width: 120px;
}

.menu {
  padding: 0 1em;
}

.menu ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu li {
  display: flex;
  align-items: center;
  padding: 0.75em 1em;
  margin-bottom: 0.5em;
  cursor: pointer;
  transition: background 0.2s;
  border-radius: 0.5em;
}

.menu li:hover {
  background-color: var(--color-on-primary);
}

.menu li.active {
  background-color: var(--color-accent);
}

.icon {
  width: 1em;
  height: 1em;
  margin-right: 0.5em;
}
</style>
