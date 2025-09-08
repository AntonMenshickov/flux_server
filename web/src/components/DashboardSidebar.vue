<template>
  <aside class="sidebar">

    <nav class="menu">
      <ul>
        <li v-if="showUsers" :class="{ active: activeItem === 'users' }" @click="setActive('users')">
          <UserIcon class="icon" />
          <span>Users</span>
        </li>
        <li :class="{ active: activeItem === 'apps' }" @click="setActive('apps')">
          <CommandLineIcon class="icon" />
          <span>Apps</span>
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

<script setup lang="ts">
import { UserIcon, DocumentTextIcon, Cog6ToothIcon, CommandLineIcon } from '@heroicons/vue/24/outline';
import { useUserStore } from '@/stores/user';
import { ref } from 'vue';

type SidebarItem = 'users' | 'logs' | 'apps' | 'settings';
const activeItem = ref<SidebarItem>('logs')
const emit = defineEmits(['update:active'])
const userStore = useUserStore();



function showUsers(): boolean {
  return userStore.profile?.isOwner || false;
}

function setActive(item: SidebarItem) {
  activeItem.value = item;
  emit('update:active', item);
}
</script>

<style scoped>
.sidebar {
  width: 250px;
  background-color: var(--color-primary);
  color: #fff;
  display: flex;
  flex-direction: column;
}



.menu {
  padding: 1.1em 1em;
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
