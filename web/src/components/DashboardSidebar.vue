<template>
  <aside class="sidebar">

    <nav class="menu">
      <router-link v-if="showUsers" :to="{ name: 'users' }" :class="{ active: activeItem == SidebarItemEnum.users }">
        <UserIcon class="icon" />
        <span>Users</span>
      </router-link>
      <router-link :to="{ name: 'apps' }" :class="{ active: activeItem == SidebarItemEnum.apps }">
        <CommandLineIcon class="icon" />
        <span>Apps</span>
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

onMounted(async () => {
  const path = route.path.split('/').pop();
  if (path) {
    activeItem.value = path as SidebarItemEnum;
  }
});

watch<string>(
  () => route.path,
  (newPath: string) => {
    const path = newPath.split('/').pop();
    if (!path) return;
    activeItem.value = path as SidebarItemEnum;
  }
)


const activeItem = ref<SidebarItemEnum>(SidebarItemEnum.logs)
const userStore = useUserStore();

const showUsers = computed(() => userStore.profile?.isOwner || false);

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
