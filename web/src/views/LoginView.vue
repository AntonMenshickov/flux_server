<template>
  <div class="login">
    <FluxLogo />
    <h1>Login</h1>
    <form @submit.prevent="doLogin">
      <BaseInput class="input" v-model="username" placeholder="username" />
      <BaseInput class="input" v-model="password" type="password" placeholder="password" />
      <BaseButton class="button" @click="doLogin">Login</BaseButton>
    </form>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/userStore';
import FluxLogo from '@/components/FluxLogo.vue';
import { useRouterUtils } from '@/utils/routerUtils';
import { users } from '@/api/users';
import { auth } from '@/api/auth';
import { ref } from 'vue';
import BaseInput from '@/components/base/BaseInput.vue';
import BaseButton from '@/components/base/BaseButton.vue';


const username = ref<string>('');
const password = ref<string>('');
const userStore = useUserStore();
const routerUtils = useRouterUtils();

async function doLogin() {
  const authResult = await auth.login(username.value, password.value);
  if (authResult.isLeft()) {
    alert(`Login failed: ${authResult.value.message}`);
    return;
  }
  const token = authResult.value.result;
  userStore.setToken(token);

  const profileResult = await users.profile();
  if (profileResult.isLeft()) {
    alert(`Failed to fetch profile: ${profileResult.value.message}`);
    return;
  }
  userStore.setProfile(profileResult.value.result);
  routerUtils.navigateToDashboard();
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
  padding: var(--spacing-sm);
  font-size: var(--font-size-lg);
  border-radius: var(--border-radius-md);
}

.login .button {
  padding: var(--spacing-md);
  font-size: var(--font-size-lg);
  border-radius: var(--border-radius-md);
  background-color: var(--color-accent);
  color: var(--color-white);
  border: none;
  cursor: pointer;
}
</style>
