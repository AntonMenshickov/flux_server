<template>
  <aside class="sidebar">

    <nav class="menu">
      <router-link v-if="showUsers" :to="{ name: ROUTE_NAMES.USERS }" :class="{ active: activeItem == SidebarItemEnum.users }">
        <UserIcon class="icon" />
        <span>Users</span>
      </router-link>
      <router-link :to="{ name: ROUTE_NAMES.APPLICATIONS }" :class="{ active: activeItem == SidebarItemEnum.apps }">
        <CommandLineIcon class="icon" />
        <span>Applications</span>
      </router-link>
      <router-link :to="{ name: ROUTE_NAMES.LOGS }" :class="{ active: activeItem == SidebarItemEnum.logs }">
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
import { ROUTE_NAMES } from '@/router/routes';

const route = useRoute();
const activeItem = ref<SidebarItemEnum>(SidebarItemEnum.logs);
const userStore = useUserStore();

const showUsers = computed(() => userStore.profile?.isOwner || false);

function getActiveItem(): SidebarItemEnum {
  // Determine active item based on route name or path
  const routeName = route.name?.toString();
  
  if (routeName === ROUTE_NAMES.USERS) {
    return SidebarItemEnum.users;
  }
  
  if (routeName === ROUTE_NAMES.APPLICATIONS) {
    return SidebarItemEnum.apps;
  }
  
  // Use logs for routes: logs, event-logs, and online-log-stream
  if (routeName === ROUTE_NAMES.LOGS || routeName === ROUTE_NAMES.EVENT_LOGS || routeName === ROUTE_NAMES.ONLINE_LOG_STREAM) {
    return SidebarItemEnum.logs;
  }
  
  // Fallback: check path
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
  padding: 1.1em var(--spacing-lg);
}

.menu a {
  display: flex;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  margin-bottom: var(--spacing-sm);
  cursor: pointer;
  transition: background var(--transition-base);
  border-radius: var(--border-radius-sidebar-item);
  color: var(--color-white);
  text-decoration: none;
}

.menu a:hover {
  background-color: var(--color-on-primary);
}

.menu a.active {
  background-color: var(--color-accent);
}

.icon {
  width: var(--icon-size-sm);
  height: var(--icon-size-sm);
  margin-right: var(--spacing-sm);
}
</style>
