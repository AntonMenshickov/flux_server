import type { SidebarItemEnum } from '@/model/sidebarItemEnum';
import { defineStore } from 'pinia';

export const useAppStateStore = defineStore('appState', {
  state: () => ({
    page: null as null | SidebarItemEnum,
  }),
  getters: {
  },
  actions: {
    setPage(page: SidebarItemEnum) {
      this.page = page;
    },
  },
  persist: true,
});
