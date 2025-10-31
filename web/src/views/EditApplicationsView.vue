<template>
  <div class="applications-list">
    <div class="top-bar">
      <BaseInput type="text" v-model="searchQuery" placeholder="Search applications..." @input="onSearchInput" />

      <BaseButton @click="openCreateModal(null)">Add app</BaseButton>
    </div>

    <ul v-if="applicationsList.length > 0">
      <li v-for="app in applicationsList" :key="app.id">
        <div class="list-title">
          <span>{{ app.name }}</span>
          <span>
            <PencilSquareIcon class="action-icon" @click="openCreateModal(app)" />
            <TrashIcon class="action-icon delete" @click="confirmDelete(app)" />
          </span>
        </div>
        <div v-if="app.bundles.length > 0" class="application-options">
          <span><strong>Token: </strong>
            <BaseInput :readonly="true" :initialValue="app.token" />
          </span>
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

    <ModalDialog :show="showCreateModal" cancelText="Cancel" :confirmText="null" :isDanger="false"
      @cancel="closeCreateModal">
      <EditApplication :application="applicationToEdit" :onSaveApplication="onApplicationSave" />

    </ModalDialog>
  </div>
</template>

<script setup lang="ts">
import { TrashIcon, PencilSquareIcon } from '@heroicons/vue/24/outline';
import ModalDialog from '@/components/ModalDialog.vue';
import BaseInput from '@/components/base/BaseInput.vue';
import BaseButton from '@/components/base/BaseButton.vue';
import { onMounted, ref } from 'vue';
import { applications } from '@/api/applications';
import { debounce } from 'lodash';
import EditApplication from '@/components/base/EditApplication.vue';
import type { Application } from '@/model/application/application';
import type { Bundle } from '@/model/application/bundle';
import type { User } from '@/model/user';


const applicationsList = ref<Application[]>([]);
const searchQuery = ref<string>('');
const showDeleteModal = ref<boolean>(false);
const applicationToDelete = ref<Application | null>(null);
const applicationToEdit = ref<Application | null>(null);

const showCreateModal = ref<boolean>(false);


const appsPerPage: number = 10;

const debouncedSearch = debounce(fetchApplications, 200);


onMounted(() => {
  fetchApplications();
});


async function fetchApplications() {
  const result = await applications.search(searchQuery.value, appsPerPage, 0);
  if (result.isLeft()) {
    alert(`Failed to fetch applications: ${result.value.message}`);
    return;
  }
  applicationsList.value = result.value.result.applications;
}

async function onApplicationSave(application: { id: string | null, name: string, bundles: Bundle[], maintainers: User[] }) {
  const addResult = application.id ? await applications.updateApplication(
    application.id,
    application.name,
    application.bundles,
    application.maintainers.map(e => e.id),
  ) : await applications.addApplication(
    application.name,
    application.bundles,
    application.maintainers.map(e => e.id),
  );
  if (addResult.isLeft()) {
    alert(`Failed to create application: ${addResult.value.message}`);
  } else {
    const indexOfApp = applicationsList.value.findIndex(e => e.id == addResult.value.result.id);
    if (indexOfApp == -1) {
      applicationsList.value = [addResult.value.result, ...applicationsList.value];
    } else {
      applicationsList.value[indexOfApp] = addResult.value.result;
    }
    showCreateModal.value = false;
  }
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

function openCreateModal(application: Application | null) {
  applicationToEdit.value = application;
  showCreateModal.value = true;
}

function closeCreateModal() {
  applicationToEdit.value = null;
  showCreateModal.value = false;
}

</script>


<style scoped>
.applications-list {
  max-width: 600px;
  margin: 2rem auto;
  font-family: sans-serif;
  color: var(--color-text);
}

/* Top bar */
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

/* List */
.applications-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.applications-list li {
  background: var(--color-panel-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
  transition: box-shadow var(--transition-base);
  color: var(--color-text);
}

.applications-list li:hover {
  box-shadow: var(--box-shadow);
}

.list-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-lg);
}

.action-icon {
  width: var(--icon-size-sm);
  height: var(--icon-size-sm);
  color: var(--color-accent);
  cursor: pointer;
  opacity: 0.6;
  transition: opacity var(--transition-base), transform var(--transition-base);
}

.action-icon.delete {
  color: var(--color-danger);
}

.action-icon:hover {
  opacity: 1;
  transform: scale(1.1);
}

.application-options {
  margin-top: var(--spacing-md);
  display: flex;
  flex-direction: column;
  align-items: start;
  gap: 0.4em;
  font-size: var(--font-size-base);
  color: var(--color-text-dimmed);
}
</style>

