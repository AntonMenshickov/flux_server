<template>
  <div class="user-list">
    <ul>
      <li v-for="user in users" :key="user.id">
        <span>{{ user.login }}</span>
        <TrashIcon class="delete-icon" @click="confirmDelete(user)" />
      </li>
    </ul>

    <!-- Модальное окно подтверждения -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal">
        <p>Удалить пользователя <strong>{{ userToDelete?.login }}</strong>?</p>
        <div class="modal-buttons">
          <button class="cancel" @click="cancelDelete">Отмена</button>
          <button class="confirm" @click="deleteUser">Удалить</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { TrashIcon } from '@heroicons/vue/24/outline';

interface User {
  id: number;
  login: string;
}

@Options({
  components: {
    TrashIcon
  },
})
export default class UserList extends Vue {
  users: User[] = [
    { id: 1, login: 'ivan' },
    { id: 2, login: 'anna' },
    { id: 3, login: 'sergey' },
  ];

  showModal = false;
  userToDelete: User | null = null;

  confirmDelete(user: User) {
    this.userToDelete = user;
    this.showModal = true;
  }

  cancelDelete() {
    this.userToDelete = null;
    this.showModal = false;
  }

  deleteUser() {
    const userToDelete = this.userToDelete;
    if (userToDelete) {
      this.users = this.users.filter(u => u.id !== userToDelete.id);
    }
    this.cancelDelete();
  }
}
</script>

<style scoped>
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
  background-color: var(--color-secondary);
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
  min-width: 300px;
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
  background-color: var(--color-danger);
  color: var(--color-secondary);
}
</style>
