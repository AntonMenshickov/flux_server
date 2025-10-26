<template>
  <aside class="sidebar">

    <nav class="menu">
      <router-link v-if="showUsers" :to="{ name: 'users' }" :class="{ active: activeItem == SidebarItemEnum.users }">
        <UserIcon class="icon" />
        <span>Users</span>
      </router-link>
      <router-link :to="{ name: 'applications' }" :class="{ active: activeItem == SidebarItemEnum.apps }">
        <CommandLineIcon class="icon" />
        <span>Applications</span>
      </router-link>
      <router-link :to="{ name: 'logs' }" :class="{ active: activeItem == SidebarItemEnum.logs }">
        <DocumentTextIcon class="icon" />
        <span>Logs</span>
      </router-link>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { UserIcon, DocumentTextIcon, CommandLineIcon } from '@heroicons/vue/24/outline';
import { useUserStore } from '@/stores/userStore';
import { computed, onMounted, ref, watch } from 'vue';
import { SidebarItemEnum } from '@/model/sidebarItemEnum';
import { useRoute } from 'vue-router';

const route = useRoute();
const activeItem = ref<SidebarItemEnum>(SidebarItemEnum.logs);
const userStore = useUserStore();

const showUsers = computed(() => userStore.profile?.isOwner || false);

function getActiveItem(): SidebarItemEnum {
  // Определяем активный элемент на основе имени роута или пути
  const routeName = route.name?.toString();
  
  if (routeName === 'users') {
    return SidebarItemEnum.users;
  }
  
  // 'applications' теперь это управление приложениями
  if (routeName === 'applications') {
    return SidebarItemEnum.apps;
  }
  
  // Для роутов logs, event-logs и online-log-stream используем logs
  if (routeName === 'logs' || routeName === 'event-logs' || routeName === 'online-log-stream') {
    return SidebarItemEnum.logs;
  }
  
  // Fallback: проверяем путь
  const path = route.path;
  if (path.includes('/users')) {
    return SidebarItemEnum.users;
  }
  if (path.includes('/applications')) {
    return SidebarItemEnum.apps;
  }
  if (path.includes('/logs')) {
    return SidebarItemEnum.logs;
  }
  
  return SidebarItemEnum.logs;
}

onMounted(() => {
  activeItem.value = getActiveItem();
});

watch(
  () => [route.path, route.name],
  () => {
    activeItem.value = getActiveItem();
  }
);

</script>

<style scoped>
.sidebar {
  width: 250px;
  background-color: var(--color-primary);
  color: #fff;
  display: flex;
  flex-direction: column;
  position: fixed;
  height: calc(100% - var(--appbar-height));
  bottom: 0;
}


.menu {
  padding: 1.1em 1em;
}

.menu a {
  display: flex;
  align-items: center;
  padding: 0.75em 1em;
  margin-bottom: 0.5em;
  cursor: pointer;
  transition: background 0.2s;
  border-radius: 0.5em;
  color: #fff;
  text-decoration: none;
}

.menu a:hover {
  background-color: var(--color-on-primary);
}

.menu a.active {
  background-color: var(--color-accent);
}

.icon {
  width: 1em;
  height: 1em;
  margin-right: 0.5em;
}
</style>
