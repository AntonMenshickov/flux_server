import { defineStore } from 'pinia';

type Token = { accessToken: string, refreshToken: string };
type Profile = { id: string, login: string, isOwner: boolean };


export const useUserStore = defineStore('user', {
  state: () => ({
    token: null as null | Token,
    profile: null as null | Profile,
  }),
  getters: {
    isAuthenticated: (state) => state.token !== null,
    isOwner: (state) => state.profile?.isOwner === true,
  },
  actions: {
    setToken(token: Token) {
      this.token = token;
    },
    setProfile(profile: Profile) {
      this.profile = profile;
    },
    logout() {
      this.token = null;
      this.profile = null;
    }
  },
});
