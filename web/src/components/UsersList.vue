<template>
  <div class="user-list">
    <!-- Поле поиска -->
    <input type="text" v-model="searchQuery" placeholder="Поиск пользователей..." @input="onSearchInput"
      class="search-input" />

    <!-- Кнопка создания пользователя -->
    <button class="create-btn" @click="openCreateModal">Create User</button>

    <ul v-if="usersList.length > 0">
      <li v-for="user in usersList" :key="user.id">
        <span>{{ user.login }}</span>
        <TrashIcon class="delete-icon" @click="confirmDelete(user)" />
      </li>
    </ul>
    <p v-else>No users found.</p>


    <div v-if="showDeleteModal" class="modal-overlay">
      <div class="modal">
        <p>Удалить пользователя <strong>{{ userToDelete?.login }}</strong>?</p>
        <div class="modal-buttons">
          <button class="cancel" @click="cancelDelete">Отмена</button>
          <button class="confirm danger" @click="deleteUser">Удалить</button>
        </div>
      </div>
    </div>

    <!-- Модальное окно создания пользователя -->
    <div v-if="showCreateModal" class="modal-overlay">
      <div class="modal">
        <p>Создать нового пользователя</p>
        <input type="text" v-model="newLogin" placeholder="Логин" />
        <input type="password" v-model="newPassword" placeholder="Пароль" />
        <div class="modal-buttons">
          <button class="cancel" @click="closeCreateModal">Отмена</button>
          <button class="confirm" @click="createUser">Создать</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { TrashIcon } from '@heroicons/vue/24/outline';
import { User, users } from '@/api/users';
import { debounce } from 'lodash';

@Options({
  components: {
    TrashIcon
  },
})
export default class UserList extends Vue {
  usersList: User[] = [];
  private totalUsers: number = 0;
  private usersPerPage: number = 10;

  searchQuery = '';
  private debouncedSearch = debounce(this.fetchUsers, 200);

  showDeleteModal = false;
  userToDelete: User | null = null;

  showCreateModal = false;
  newLogin = '';
  newPassword = '';

  async mounted() {
    await this.fetchUsers();
  }

  private async fetchUsers() {
    const result = await users.search(this.searchQuery, this.usersPerPage, 0);
    if (result.isLeft()) {
      alert(`Failed to fetch users: ${result.value.message}`);
      return;
    }
    this.usersList = result.value.result.users;
    this.totalUsers = result.value.result.total;
  }

  onSearchInput() {
    this.debouncedSearch();
  }

  public confirmDelete(user: User) {
    this.userToDelete = user;
    this.showDeleteModal = true;
  }

  public cancelDelete() {
    this.userToDelete = null;
    this.showDeleteModal = false;
  }

  public async deleteUser() {
    const userToDelete = this.userToDelete;
    if (userToDelete) {

      const deleteResult = await users.deleteUser(userToDelete.id);
      if (deleteResult.isLeft()) {
        alert(`Failed to delete user: ${deleteResult.value.message}`);
      } else {
        this.usersList = this.usersList.filter(u => u.id !== userToDelete.id);
      }
    }
    this.cancelDelete();
  }

  public openCreateModal() {
    this.newLogin = '';
    this.newPassword = '';
    this.showCreateModal = true;
  }

  public closeCreateModal() {
    this.showCreateModal = false;
  }

  public async createUser() {
    if (!this.newLogin || !this.newPassword) {
      alert('Enter both login and password');
      return;
    }

    const addResult = await users.addUser(this.newLogin, this.newPassword);
    if (addResult.isLeft()) {
      alert(`Failed to create user: ${addResult.value.message}`);
    } else {
      this.usersList = [addResult.value.result, ...this.usersList];
    }

    this.closeCreateModal();
  }
}
</script>

<style scoped>
.search-input {
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 1rem;
  border-radius: 4px;
  border: 1px solid var(--color-on-primary);
}

.create-btn {
  padding: 0.5rem 1rem;
  margin-bottom: 1rem;
  border: none;
  border-radius: 4px;
  background-color: var(--color-primary);
  color: var(--color-secondary);
  cursor: pointer;
}

.create-btn:hover {
  opacity: 0.8;
}

.user-list {
  max-width: 400px;
  margin: 2rem auto;
  font-family: sans-serif;
}

.user-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
  border: 1px solid var(--color-on-primary);
  border-radius: 6px;
  background-color: var(--color-secondary);
}

.user-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-on-primary);
  cursor: default;
  transition: background 0.2s;
}

.user-list li:last-child {
  border-bottom: none;
}

.user-list li:hover {
  background-color: var(--color-on-primary);
  color: var(--color-secondary);
}

.delete-icon {
  width: 20px;
  height: 20px;
  color: var(--color-danger);
  cursor: pointer;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.1s;
}

.user-list li:hover .delete-icon {
  visibility: visible;
  opacity: 1;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  display: flex;
  flex-direction: column;
  background-color: var(--color-secondary);
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
  min-width: 300px;
}

.modal input {
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  border-radius: 4px;
  border: 1px solid var(--color-on-primary);
}

.modal-buttons {
  margin-top: 1rem;
  display: flex;
  justify-content: space-around;
}

.modal-buttons button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.modal-buttons .cancel {
  background-color: var(--color-on-primary);
  color: var(--color-secondary);
}

.modal-buttons .confirm {
  background-color: var(--color-accent);
  color: var(--color-secondary);
}

.modal-buttons .confirm.danger {
  background-color: var(--color-danger);
}
</style>
