<template>
  <div class="applications-list">
    <div class="top-bar">
      <BaseInput type="text" v-model="searchQuery" placeholder="Search applications..." @input="onSearchInput" />

      <BaseButton @click="openCreateModal">Add app</BaseButton>
    </div>

    <ul v-if="applicationsList.length > 0">
      <li v-for="app in applicationsList" :key="app.id">
        <div class="list-title">
          <span>{{ app.name }}</span>
          <TrashIcon class="delete-icon" @click="confirmDelete(app)" />
        </div>
        <div v-if="app.bundles.length > 0" class="application-options">
          <span><strong>Token: </strong><BaseInput :readonly="true" :initialValue="app.token" /></span>
          <strong>Bundle Ids:</strong>
          <div v-for="(bundle, index) in app.bundles" :key="index">
            <span>{{ bundle.platform }}: {{ bundle.bundleId }}</span>
          </div>
        </div>


      </li>
    </ul>
    <p v-else>No applications found.</p>


    <ModalDialog :show="showDeleteModal" cancelText="Cancel" confirmText="Delete" :isDanger="true"
      @cancel="cancelDelete" @confirm="deleteApplication">
      <p>Delete application <strong>{{ applicationToDelete?.name }}</strong>?</p>
    </ModalDialog>

    <ModalDialog :show="showCreateModal" cancelText="Cancel" confirmText="Create" :isDanger="false"
      @cancel="closeCreateModal" @confirm="createApplication">
      <p>Create new application</p>
      <BaseInput type="text" v-model="newLogin" placeholder="Application name" />
      <ul v-if="newBundleIds && newBundleIds.length > 0">
        <li v-for="(bundle, index) in newBundleIds" :key="index">
          <BaseInput type="text" v-model="bundle.platform" placeholder="Platform" />
          <BaseInput type="text" v-model="bundle.bundleId" placeholder="Bundle id" />
          <TrashIcon class="delete-icon" @click="deleteBundle(index)" />
        </li>
      </ul>
      <BaseButton class="create-btn" @click="addBundle">Add bundle id</BaseButton>

    </ModalDialog>
  </div>
</template>

<script setup lang="ts">
import { TrashIcon } from '@heroicons/vue/24/outline';
import ModalDialog from '@/components/ModalDialog.vue';
import { debounce } from 'lodash';
import { onMounted, ref } from 'vue';
import { Application, applications } from '@/api/applications';
import BaseInput from './BaseInput.vue';
import BaseButton from './BaseButton.vue';



const applicationsList = ref<Application[]>([]);
const searchQuery = ref<string>('');
const showDeleteModal = ref<boolean>(false);
const applicationToDelete = ref<Application | null>(null);

const showCreateModal = ref<boolean>(false);
const newLogin = ref<string>('');
const newBundleIds = ref<{ platform: string, bundleId: string }[] | null>(null);


let totalApplications: number = 0;
const appsPerPage: number = 10;

let debouncedSearch = debounce(fetchApplications, 200);


onMounted(() => {
  fetchApplications(); // Call the function when the component is mounted
});

function deleteBundle(index: number) {
  newBundleIds.value = newBundleIds.value?.splice(index, 1) ?? null;
}

function addBundle() {
  newBundleIds.value = [...newBundleIds.value ?? [], { platform: '', bundleId: '' }];
}

async function fetchApplications() {
  const result = await applications.search(searchQuery.value, appsPerPage, 0);
  if (result.isLeft()) {
    alert(`Failed to fetch applications: ${result.value.message}`);
    return;
  }
  applicationsList.value = result.value.result.applications;
  totalApplications = result.value.result.total;
}

function onSearchInput() {
  debouncedSearch();
}

function confirmDelete(application: Application) {
  applicationToDelete.value = application;
  showDeleteModal.value = true;
}

function cancelDelete() {
  applicationToDelete.value = null;
  showDeleteModal.value = false;
}

async function deleteApplication() {
  const deleteApplication = applicationToDelete.value;
  if (deleteApplication) {

    const deleteResult = await applications.deleteApplication(deleteApplication.id);
    if (deleteResult.isLeft()) {
      alert(`Failed to delete application: ${deleteResult.value.message}`);
    } else {
      applicationsList.value = applicationsList.value.filter(u => u.id !== deleteApplication.id);
    }
  }
  cancelDelete();
}

function openCreateModal() {
  newLogin.value = '';
  newBundleIds.value = [{platform: '', bundleId: ''}];
  showCreateModal.value = true;
}

function closeCreateModal() {
  showCreateModal.value = false;
}

async function createApplication() {
  if (!newLogin.value || !newBundleIds.value) {
    alert('Enter both name and at least one bundle id');
    return;
  }

  const addResult = await applications.addApplication(newLogin.value, newBundleIds.value);
  if (addResult.isLeft()) {
    alert(`Failed to create application: ${addResult.value.message}`);
  } else {
    applicationsList.value = [addResult.value.result, ...applicationsList.value];
  }

  closeCreateModal();
}
</script>


<style scoped>
.applications-list {
  max-width: 600px;
  margin: 2rem auto;
  font-family: sans-serif;
}

/* Верхняя панель */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
}

.top-bar input {
  flex: 1;
}

/* Список */
.applications-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.applications-list li {
  background: var(--color-secondary);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 1rem;
  transition: box-shadow 0.2s;
}

.applications-list li:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.list-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 1rem;
}

.delete-icon {
  width: 20px;
  height: 20px;
  color: var(--color-danger);
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s, transform 0.2s;
}

.delete-icon:hover {
  opacity: 1;
  transform: scale(1.1);
}

.application-options {
  margin-top: 0.75em;
  display: flex;
  flex-direction: column;
  align-items: start;
  gap: 0.4em;
  font-size: 0.9rem;
  color: #555;
}


.modal ul {
  margin-bottom: 0.75rem;
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.modal ul li {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.modal ul li input {
  flex: 1;
  margin: 0;
}

.modal .delete-icon {
  opacity: 0.7;
}

.modal .delete-icon:hover {
  opacity: 1;
}
</style>
