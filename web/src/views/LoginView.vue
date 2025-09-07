<template>
  <div class="login">
    <FluxLogo />
    <h1>Login</h1>
    <form @submit.prevent="doLogin">
      <input class="input" v-model="username" placeholder="username" />
      <input class="input" v-model="password" type="password" placeholder="password" />
      <button class="button" @click="doLogin">Login</button>
    </form>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { useUserStore } from '@/stores/user';
import FluxLogo from '@/components/FluxLogo.vue';
import router from '@/router';
import { users } from '@/api/users';
import { auth } from '@/api/auth';

@Options({
  components: {
    FluxLogo
  },
})
export default class LoginView extends Vue {
  username: string = '';
  password: string = '';
  private userStore = useUserStore();

  public async doLogin() {
    const authResult = await auth.login(this.username, this.password);
    if (authResult.isLeft()) {
      alert(`Login failed: ${authResult.value.message}`);
      return;
    }
    const token = authResult.value.result;
    this.userStore.setToken(token);

    const profileResult = await users.profile();
    if (profileResult.isLeft()) {
      alert(`Failed to fetch profile: ${profileResult.value.message}`);
      return;
    }
    this.userStore.setProfile(profileResult.value.result);
    router.push({ path: '/dashboard' });
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.login {
  max-width: 300px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.login form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.login .input {
  padding: 8px;
  font-size: 16px;
  border-radius: 8px;
}

.login .button {
  padding: 10px;
  font-size: 16px;
  border-radius: 8px;
  background-color: var(--color-accent);
  color: white;
  border: none;
  cursor: pointer;
}
</style>
