<template>
  <div class="user-list">
    <div class="search-and-create">
      <BaseInput type="text" v-model="searchQuery" placeholder="Search users..." @input="onSearchInput" />

      <BaseButton @click="openCreateModal">Create User</BaseButton>
    </div>

    <ul v-if="usersList.length > 0">
      <li v-for="user in usersList" :key="user.id">
        <span>{{ user.login }}</span>
        <TrashIcon class="delete-icon" @click="confirmDelete(user)" />
      </li>
    </ul>
    <p v-else>No users found.</p>


    <ModalDialog :show="showDeleteModal" cancelText="Cancel" confirmText="Delete" :isDanger="true"
      @cancel="cancelDelete" @confirm="deleteUser">
      <p>Delete user <strong>{{ userToDelete?.login }}</strong>?</p>
    </ModalDialog>

    <ModalDialog :show="showCreateModal" cancelText="Cancel" confirmText="Create" :isDanger="false"
      @cancel="closeCreateModal" @confirm="createUser">
      <p>Create new user</p>
      <input type="text" v-model="newLogin" placeholder="Login" />
      <input type="password" v-model="newPassword" placeholder="Password" />
    </ModalDialog>
  </div>
</template>

<script setup lang="ts">
import { TrashIcon } from '@heroicons/vue/24/outline';
import ModalDialog from '@/components/ModalDialog.vue';
import { users } from '@/api/users';
import { debounce } from 'lodash';
import { onMounted, ref } from 'vue';
import BaseInput from './base/BaseInput.vue';
import BaseButton from './base/BaseButton.vue';
import type { User } from '@/model/user';


const usersList = ref<User[]>([]);
const searchQuery = ref<string>('');
const showDeleteModal = ref<boolean>(false);
const userToDelete = ref<User | null>(null);

const showCreateModal = ref<boolean>(false);
const newLogin = ref<string>('');
const newPassword = ref<string>('');


const usersPerPage: number = 10;

const debouncedSearch = debounce(fetchUsers, 200);


onMounted(() => {
  fetchUsers();
});

async function fetchUsers() {
  const result = await users.search(searchQuery.value, usersPerPage, 0);
  if (result.isLeft()) {
    alert(`Failed to fetch users: ${result.value.message}`);
    return;
  }
  usersList.value = result.value.result.users;
}

function onSearchInput() {
  debouncedSearch();
}

function confirmDelete(user: User) {
  userToDelete.value = user;
  showDeleteModal.value = true;
}

function cancelDelete() {
  userToDelete.value = null;
  showDeleteModal.value = false;
}

async function deleteUser() {
  const deleteUser = userToDelete.value;
  if (deleteUser) {

    const deleteResult = await users.deleteUser(deleteUser.id);
    if (deleteResult.isLeft()) {
      alert(`Failed to delete user: ${deleteResult.value.message}`);
    } else {
      usersList.value = usersList.value.filter(u => u.id !== deleteUser.id);
    }
  }
  cancelDelete();
}

function openCreateModal() {
  newLogin.value = '';
  newPassword.value = '';
  showCreateModal.value = true;
}

function closeCreateModal() {
  showCreateModal.value = false;
}

async function createUser() {
  if (!newLogin.value || !newPassword.value) {
    alert('Enter both login and password');
    return;
  }

  const addResult = await users.addUser(newLogin.value, newPassword.value);
  if (addResult.isLeft()) {
    alert(`Failed to create user: ${addResult.value.message}`);
  } else {
    usersList.value = [addResult.value.result, ...usersList.value];
  }

  closeCreateModal();
}
</script>


<style scoped>
.search-and-create {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.search-and-create input {
  flex: 1;
}



.user-list {
  max-width: 400px;
  margin: 2rem auto;
  font-family: sans-serif;
  color: var(--color-text);
}

.user-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  background-color: var(--color-panel-bg);
}

.user-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
  cursor: default;
  transition: background var(--transition-base);
  color: var(--color-text);
}

.user-list li:last-child {
  border-bottom: none;
}

.user-list li:hover {
  background-color: var(--color-hover-bg);
}

.delete-icon {
  width: 20px;
  height: 20px;
  color: var(--color-danger);
  cursor: pointer;
  opacity: 0;
  visibility: hidden;
  transition: opacity var(--transition-fast);
}

.user-list li:hover .delete-icon {
  visibility: visible;
  opacity: 1;
}


.modal input {
  padding: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  border-radius: var(--border-radius-xs);
  border: 1px solid var(--color-border);
  background-color: var(--color-panel-bg);
  color: var(--color-text);
}
</style>
