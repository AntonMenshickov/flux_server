<template>
  <div class="filter-selector-wrapper">
    <div v-if="modelValue" class="filter-display">
      <div class="filter-name">
        <FunnelIcon class="filter-name-icon" />
        <span>{{ modelValue.name }}</span>
        <XMarkIcon @click="clearFilter" class="clear-filter-icon" />
      </div>
      <BaseButton @click="openUpdateFilterDialog" title="Update filter" class="primary">
        <PencilSquareIcon class="action-icon" />
      </BaseButton>
      <BaseButton @click="deleteFilter" title="Delete filter" class="danger">
        <TrashIcon class="action-icon" />
      </BaseButton>
    </div>
    <div v-else class="filter-actions">
      <BaseButton v-if="criteria.length > 0" @click="showCreateFilterDialog = true" class="save-filter-btn">
        <BookmarkIcon class="action-icon" />
        Save filter
      </BaseButton>
      <BaseSelector v-model="tempSelectedFilter" :fetch-options="fetchFilters" :label-key="filterLabelKey"
        :value-key="filterValueKey" placeholder="Select an events filter..." class="events-filter-selector"
        @update:model-value="onTempFilterSelected" />
    </div>

    <!-- Create filter dialog -->
    <ModalDialog :show="showCreateFilterDialog" cancel-text="Cancel" confirm-text="Save" :is-danger="false"
      @cancel="closeCreateFilterDialog" @confirm="saveAsFilter">
      <div class="filter-dialog-content">
        <p>Save current filter:</p>
        <BaseInput v-model="newFilterName" placeholder="Filter name..." />
      </div>
    </ModalDialog>

    <!-- Update filter dialog -->
    <ModalDialog :show="showUpdateFilterDialog" cancel-text="Cancel" confirm-text="Update" :is-danger="false"
      @cancel="closeUpdateFilterDialog" @confirm="updateFilter">
      <div class="filter-dialog-content">
        <p>Update filter:</p>
        <BaseInput v-model="updateFilterName" placeholder="Filter name..." />
      </div>
    </ModalDialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { PencilSquareIcon, XMarkIcon, BookmarkIcon, FunnelIcon, TrashIcon } from '@heroicons/vue/24/outline';
import BaseSelector from '@/components/base/BaseSelector.vue';
import BaseButton from '@/components/base/BaseButton.vue';
import BaseInput from '@/components/base/BaseInput.vue';
import ModalDialog from '@/components/ModalDialog.vue';
import { eventFilters } from '@/api/eventFilters';
import { SearchCriterion } from '@/components/base/smartSearch/types';
import type { Criterion } from '@/components/base/smartSearch/types';

interface EventsFilter {
  id: string;
  name: string;
  criteria: Criterion[];
  createdAt: Date;
  updatedAt?: Date;
}

const props = defineProps<{
  modelValue: EventsFilter | null;
  criteria: SearchCriterion[];
  applicationId: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: EventsFilter | null];
  'filterApplied': [criteria: SearchCriterion[]];
}>();

const tempSelectedFilter = ref<EventsFilter | null>(null);
const showCreateFilterDialog = ref(false);
const showUpdateFilterDialog = ref(false);
const newFilterName = ref('');
const updateFilterName = ref('');

async function fetchFilters(search: string): Promise<EventsFilter[]> {
  const searchResult = await eventFilters.search(search, props.applicationId);
  if (searchResult.isRight()) {
    return searchResult.value.result.filters;
  }
  return [];
}

function onTempFilterSelected(filter: EventsFilter | null) {
  tempSelectedFilter.value = filter;
  emit('update:modelValue', filter);
  if (filter && filter.criteria) {
    applyFilterCriteria(filter.criteria);
  }
}

function clearFilter() {
  emit('update:modelValue', null);
  tempSelectedFilter.value = null;
  emit('filterApplied', []);
}

function applyFilterCriteria(criteriaList: Criterion[]) {
  const searchCriteria = criteriaList
    .map(c => SearchCriterion.fromCriterion(c))
    .filter(c => c !== null) as SearchCriterion[];
  emit('filterApplied', searchCriteria);
}

async function saveAsFilter() {
  if (!newFilterName.value.trim()) {
    alert('Please enter a filter name');
    return;
  }

  // Convert SearchCriterion[] to Criterion[]
  const criteriaList = props.criteria
    .map(c => c.toCriterion())
    .filter(c => c !== null) as Criterion[];

  if (criteriaList.length === 0) {
    alert('Please add at least one search criterion');
    closeCreateFilterDialog();
    return;
  }

  const result = await eventFilters.add(newFilterName.value, criteriaList, props.applicationId);

  if (result.isRight()) {
    const newFilter = result.value.result;
    const eventsFilter: EventsFilter = {
      id: newFilter.id,
      name: newFilter.name,
      criteria: newFilter.criteria,
      createdAt: newFilter.createdAt,
      updatedAt: newFilter.updatedAt,
    };
    emit('update:modelValue', eventsFilter);
    closeCreateFilterDialog();
  } else {
    alert(`Failed to save filter: ${result.value.message}`);
  }
}

function closeCreateFilterDialog() {
  showCreateFilterDialog.value = false;
  newFilterName.value = '';
}

function openUpdateFilterDialog() {
  if (!props.modelValue) return;
  updateFilterName.value = props.modelValue.name;
  showUpdateFilterDialog.value = true;
}

function closeUpdateFilterDialog() {
  showUpdateFilterDialog.value = false;
  updateFilterName.value = '';
}

async function updateFilter() {
  if (!props.modelValue) return;

  if (!updateFilterName.value.trim()) {
    alert('Please enter a filter name');
    return;
  }

  // Convert SearchCriterion[] to Criterion[]
  const criteriaList = props.criteria
    .map(c => c.toCriterion())
    .filter(c => c !== null) as Criterion[];

  if (criteriaList.length === 0) {
    alert('Please add at least one search criterion');
    closeUpdateFilterDialog();
    return;
  }

  const result = await eventFilters.update(props.modelValue.id, updateFilterName.value, criteriaList);

  if (result.isRight()) {
    const updatedFilter: EventsFilter = {
      id: result.value.result.id,
      name: result.value.result.name,
      criteria: result.value.result.criteria,
      createdAt: result.value.result.createdAt,
      updatedAt: result.value.result.updatedAt,
    };
    emit('update:modelValue', updatedFilter);
    closeUpdateFilterDialog();
  } else {
    alert(`Failed to update filter: ${result.value.message}`);
  }
}

const filterLabelKey = (item: EventsFilter) => item.name;
const filterValueKey = (item: EventsFilter) => item.id;

async function deleteFilter() {
  if (!props.modelValue) return;

  if (!confirm(`Are you sure you want to delete the filter "${props.modelValue.name}"?`)) {
    return;
  }

  const result = await eventFilters.remove(props.modelValue.id);
  
  if (result.isRight()) {
    emit('update:modelValue', null);
    emit('filterApplied', []);
  } else {
    alert(`Failed to delete filter: ${result.value.message}`);
  }
}
</script>

<style scoped>
.filter-selector-wrapper {
  flex: 1;
}

.filter-display {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

.filter-name {
  display: flex;
  min-width: 200px;
  min-height: 40px;
  max-height: 40px;
  box-sizing: border-box;
  align-items: center;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  transition: border-color 0.2s, box-shadow 0.2s;
  color: var(--color-text-dimmed);
  background-color: white;
}

.filter-name-icon,
.clear-filter-icon {
  width: 1.2rem;
  height: 1.2rem;
  margin-right: 0.5rem;
}

.clear-filter-icon {
  cursor: pointer;
  margin-right: 0rem;
  margin-left: auto;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.save-filter-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.action-icon {
  width: 1rem;
  height: 1rem;
}

.events-filter-selector {
  min-width: 250px;
}

.filter-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
