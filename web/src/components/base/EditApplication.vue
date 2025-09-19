<template>
  <div class="edit-application">
    <h3>Create new application</h3>
    <BaseInput type="text" v-model="name" placeholder="Application name" />
    <div class="users-wrapper">
      <br />
      <strong>Users:</strong>
      <div class="users-list">
        <div v-for="(user, index) in maintainers" :key="index">
          <div class="user">{{ user.login }} <TrashIcon class="action-icon delete" @click="deleteUser(index)" /></div>
        </div>
      </div>
      <div class="add-users-form">
        <BaseSelector v-model="userToAdd" :fetch-options="fetchUsers" :label-key="(u) => u?.login ?? 'undefined'"
          :value-key="(u) => u?.login ?? 'undefined'" placeholder="Add user" />
        <BaseButton @click="addUser">Add</BaseButton>
      </div>
    </div>
    <br />
    <strong>Bundles:</strong>
    <BaseKeyValueEditor v-model="bundles" placeholder="bundle ids" />
    <br />
    <BaseButton class="create-btn" @click="save">{{(!props.application) ? 'Create application' : 'Update application'}}</BaseButton>
  </div>
</template>

<script setup lang="ts">
import { TrashIcon } from '@heroicons/vue/24/outline';
import BaseInput from '@/components/base/BaseInput.vue';
import BaseButton from '@/components/base/BaseButton.vue';
import { users } from '@/api/users';
import { onMounted, ref } from 'vue';
import BaseKeyValueEditor from './BaseKeyValueEditor.vue';
import BaseSelector from './BaseSelector.vue';
import type { Application } from '@/model/application/application';
import type { User } from '@/model/user';
import type { Bundle } from '@/model/application/bundle';


const props = defineProps<{
  application: Application | null,
  onSaveApplication: (application: { id: string | null, name: string, bundles: Bundle[], maintainers: User[] }) => Promise<void>
}>()

const name = ref<string>('');
const bundles = ref<{ key: string, value: string }[]>([]);
const maintainers = ref<User[]>([]);
const userToAdd = ref<User | null>();

onMounted(() => {
  if (props.application) {
    name.value = props.application.name;
    bundles.value = props.application.bundles.map(e => ({key: e.platform, value: e.bundleId}));
    maintainers.value = props.application.maintainers ?? [];
  }
});


async function fetchUsers(search: string): Promise<User[]> {
  const result = await users.search(search, 10, 0);
  if (result.isLeft()) {
    alert(`Failed to fetch users: ${result.value.message}`);
    return [];
  }
  return result.value.result.users;
}

function addUser() {
  const user = userToAdd.value;
  if (!user) return;
  if (!maintainers.value.find(e => e.id == user.id)) {
    maintainers.value.push(user);
  }
  userToAdd.value = null;
}

function deleteUser(index: number) {
  maintainers.value.splice(index, 1);
}


async function save() {
  if (!name.value || bundles.value.length < 1) {
    alert('Enter both name and at least one bundle id');
    return;
  }

  props.onSaveApplication({
    id: props.application?.id ?? null,
    name: name.value,
    bundles: bundles.value.map(e => ({ platform: e.key, bundleId: e.value })),
    maintainers: maintainers.value,
  });


}
</script>


<style scoped>
.edit-application {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.5rem;
  text-align: start;
}

.users-wrapper {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.5rem;
}

.add-users-form {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.users-list {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.3rem;
  max-height: 150px;
  overflow-y: auto;
}

.user {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  min-height: 40px;
  max-height: 40px;
  box-sizing: border-box;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  font-size: 0.95rem;
}


.action-icon {
  width: 20px;
  height: 20px;
  color: var(--color-accent);
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s, transform 0.2s;
}

.action-icon.delete {
  color: var(--color-danger);
}

.action-icon:hover {
  opacity: 1;
  transform: scale(1.1);
}
</style>
