<template>
  <div class="smart-search-field" ref="wrapperRef">
    <div class="tags-container">
      <span class="tag" v-for="(c, i) in criteria" :key="'c' + i">
        {{ c.field }} {{ c.operator }} {{ c.value }}
        <button @click="removeCriterion(i)">×</button>
      </span>
      <span class="tag" v-for="(t, i) in currentTags" :key="'t' + i">{{ t }}</span>
      <div class="input-container">
        <input v-model="inputText" @focus="onFocus" @input="onInput" @keydown.arrow-down.prevent="moveSelection(1)"
          @keydown.arrow-up.prevent="moveSelection(-1)" @keydown.enter.prevent="onEnter"
          @keydown.backspace="onBackspace" :placeholder="selectedField?.placeholder ?? 'Type criterion'" aria-autocomplete="list"
          :readonly="isReadonly" :type="inputType" />
        <ul
          v-if="suggestionsVisible && suggestions.length && !(currentStage === 'value' && (selectedField?.valueType === 'date' || selectedField?.valueType === 'multiselect'))"
          class="suggestions-list" role="listbox">
          <li v-for="(s, index) in suggestions" :key="s + index" :class="{ selected: index === selectedIndex }"
            @mousedown.prevent="selectIndex(index)" role="option" :aria-selected="index === selectedIndex">
            {{ s }}
          </li>
        </ul>
        <div v-else-if="suggestionsVisible && currentStage === 'value' && selectedField?.valueType === 'date'"
          class="suggestions-list">
          <input type="datetime-local" v-model="inputText" @change="applyDate" />
        </div>
        <div v-else-if="suggestionsVisible && currentStage === 'value' && selectedField?.valueType === 'keyValue'"
          class="suggestions-list">
          <BaseKeyValueEditor v-model="keyValueInput" @submit="onEnter" placeholder="meta" />
        </div>
        <ul v-else-if="suggestionsVisible && currentStage === 'value' && selectedField?.valueType === 'multiselect'"
          class="suggestions-list">
          <li v-for="(s, index) in suggestions" :key="s + index" :class="{ selected: index === selectedIndex }">
            <label class="multiselect-option">
              <input type="checkbox" :value="s" v-model="multiselectInput" />
              <span>
                {{ s }}
              </span>
            </label>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue';
import { Operator, SearchCriterion, type FieldOption } from './types';
import BaseKeyValueEditor from '../BaseKeyValueEditor.vue';


/** props: options - список полей */
const props = defineProps<{
  options: FieldOption[];
}>();

const emit = defineEmits<{
  (e: 'update:criteria', value: SearchCriterion[]): void
}>();

// state
const criteria = reactive<SearchCriterion[]>([]);
const inputText = ref('');
const suggestions = ref<string[]>([]);
const selectedIndex = ref(0);
const suggestionsVisible = ref(false);

const currentCriterion = reactive(new SearchCriterion());
const currentTags = reactive<string[]>([]);
const currentStage = ref<'field' | 'operator' | 'value'>('field');

const wrapperRef = ref<HTMLElement | null>(null);


const selectedField = computed(() =>
  props.options.find(o => o.key === currentCriterion.field) ?? null
);

const isReadonly = computed(() => currentStage.value === 'value' &&
  (
    selectedField.value?.valueType === 'keyValue'
    || selectedField.value?.valueType === 'multiselect'
    || selectedField.value?.valueType === 'date'
  )
);
const inputType = computed(() => {
  switch (selectedField.value?.valueType) {
    case 'keyValue':
      return 'text';
    case 'number':
      return 'number';
    default:
      return 'text';
  }
});

const keyValueInput = computed({
  get: () => {
    if (inputText.value.trim() === '') return [{ key: '', value: '' }];
    return JSON.parse(inputText.value).map((e: Record<string, string>) => {
      const key = Object.keys(e)[0];
      return { key: key, value: e[key] };
    });
  },
  set: (val: { key: string; value: string }[]) => {
    inputText.value = JSON.stringify(val
      .map(e => { return { [e.key]: e.value } }),
    );
  }
});

const multiselectInput = computed({
  get: () => {
    if (inputText.value.trim() === '') return [];
    return JSON.parse(inputText.value);
  },
  set: (val: string[]) => {
    inputText.value = JSON.stringify(val.filter(e => e.trim().length > 0));
  }
});


const onFocus = () => {
  suggestionsVisible.value = true;
  const text = inputText.value ?? '';
  if (currentStage.value === 'field') showFieldSuggestions(text);
};

const onInput = async () => {
  suggestionsVisible.value = true;
  const text = inputText.value ?? '';
  if (currentStage.value === 'field') showFieldSuggestions(text);
  else if (currentStage.value === 'operator') showOperatorSuggestions(text);
  else if (currentStage.value === 'value') await showValueSuggestions(text);
};

const selectIndex = (index: number) => {
  const len = suggestions.value.length;
  if (!len) return;
  selectedIndex.value = index;
  inputText.value = suggestions.value[selectedIndex.value];
  parseAndApplyExpression();
};

const moveSelection = (delta: number) => {
  const len = suggestions.value.length;
  if (!len) return;
  selectedIndex.value = (selectedIndex.value + delta + len) % len;
  if (selectedField.value?.valueType === 'multiselect' && currentStage.value === 'value') {
    multiselectInput.value = [suggestions.value[selectedIndex.value]];
  } else {
    inputText.value = suggestions.value[selectedIndex.value];
  }
};

const showFieldSuggestions = (filter = '') => {
  const f = filter.toLowerCase();
  suggestions.value = props.options
    .filter(opt => opt.key.toLowerCase().includes(f) || String(opt.key).toLowerCase().includes(f))
    .map(opt => opt.key);
  selectedIndex.value = 0;
};

const showOperatorSuggestions = (filter = '') => {
  const opt = props.options.find(o => o.key === currentCriterion.field);
  if (!opt) {
    suggestions.value = [];
    return;
  }
  const f = filter.toLowerCase();
  suggestions.value = opt.operators
    .map(o => String(o))
    .filter(op => op.toLowerCase().includes(f));
  selectedIndex.value = 0;
};

const showValueSuggestions = async (filter = '') => {
  const opt = props.options.find(o => o.key === currentCriterion.field);
  if (!opt) {
    suggestions.value = [];
    return;
  }

  if ((opt.valueType === 'async' || opt.valueType === 'multiselect') && typeof opt.fetchValues === 'function') {
    suggestions.value = await opt.fetchValues(filter);
  } else {
    suggestions.value = [];
  }
  selectedIndex.value = 0;
  suggestionsVisible.value = true;
};

const onBackspace = () => {
  if (inputText.value === '') {
    if (currentStage.value === 'value') {
      currentCriterion.value = null;
      currentStage.value = 'operator';
      currentTags.pop();
      inputText.value = '';
      showOperatorSuggestions();
    } else if (currentStage.value === 'operator') {
      currentCriterion.operator = null;
      currentStage.value = 'field';
      currentTags.pop();
      inputText.value = '';
      showFieldSuggestions();
    } else if (currentStage.value === 'field') {
      if (currentTags.length > 0) {
        currentTags.pop();
        inputText.value = '';
        showFieldSuggestions();
        return;
      }
      if (criteria.length != 0) {
        const last = criteria.pop();
        if (last) {
          currentCriterion.field = last.field;
          currentCriterion.operator = last.operator;
          currentCriterion.value = last.value;
          currentStage.value = 'value';
          currentTags.push(last.field ?? '', last.operator ?? '');
          inputText.value = '';
          showValueSuggestions();
        }
      }
    }
  }
};

const onEnter = async () => {
  if (suggestions.value.length > 0) {
    if (selectedField.value?.valueType === 'multiselect' && currentStage.value === 'value') {
      inputText.value = JSON.stringify(multiselectInput.value.length == 0 ? [suggestions.value[selectedIndex.value]] : multiselectInput.value);
    } else {
      inputText.value = suggestions.value[selectedIndex.value] ?? '';
    }
  }
  parseAndApplyExpression();
};


const parseAndApplyExpression = () => {
  const input = [...currentTags, inputText.value.trim()].join('');
  if (!input) return false;
  const fieldOption = props.options.find(opt =>
    input.toLowerCase().startsWith(opt.key.toLowerCase())
  );
  if (!fieldOption) return false;

  const field = fieldOption.key;

  const op = fieldOption.operators.find(op =>
    input.includes(op)
  );
  if (!op) {
    currentTags.splice(0, currentTags.length, field);
    inputText.value = '';
    currentStage.value = 'operator';
    currentCriterion.field = field;
    currentCriterion.operator = null;
    currentCriterion.value = null;
    showOperatorSuggestions();
    return true;
  }

  const parts = input.split(op).filter(p => p.trim().length > 0).map(p => p.trim());
  if (parts.length < 2) {
    currentTags.splice(0, currentTags.length, field, String(op));
    inputText.value = '';
    currentStage.value = 'value';
    currentCriterion.field = field;
    currentCriterion.operator = op as Operator;
    currentCriterion.value = null;
    showValueSuggestions();
    return true;
  }

  const valueRaw = parts.slice(1).join(op).trim();

  const criterion = new SearchCriterion(field, op as Operator, valueRaw);
  criteria.push(criterion);
  emit('update:criteria', criteria);

  resetState();

  return true;
};

const removeCriterion = (index: number) => {
  criteria.splice(index, 1);
  emit('update:criteria', criteria);
};

const handleClickOutside = (event: MouseEvent) => {
  if (wrapperRef.value && !wrapperRef.value.contains(event.target as Node)) {
    suggestionsVisible.value = false;
  }
};

const applyDate = () => {
  if (!inputText.value) return;
  currentCriterion.value = inputText.value;
  currentTags.push(inputText.value);
  criteria.push(new SearchCriterion(currentCriterion.field, currentCriterion.operator, currentCriterion.value));
  emit('update:criteria', criteria);

  resetState();
};

const resetState = () => {
  currentCriterion.field = null;
  currentCriterion.operator = null;
  currentCriterion.value = null;
  currentStage.value = 'field';
  currentTags.splice(0, currentTags.length);
  inputText.value = '';
  suggestionsVisible.value = false;
};

onMounted(() => document.addEventListener('click', handleClickOutside));
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside));


</script>

<style scoped>
.smart-search-field {
  display: flex;
  flex-direction: column;
  min-height: 40px;
  padding: 0.35rem 0.6rem;
  box-sizing: border-box;
  border-radius: 8px;
  border: 1px solid var(--color-border, #d0d0d0);
  font-size: 0.95rem;
  background: white;
}

/* подсветка при фокусе внутри */
.smart-search-field:focus-within {
  border-color: var(--color-primary, #2b7cff);
  box-shadow: 0 4px 12px rgba(43, 124, 255, 0.12);
}

.input-container {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  column-gap: 6px;
  row-gap: 6px;
  align-items: center;
}

.tag {
  background-color: #eef2ff;
  padding: 4px 8px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  text-align: start;
}

.tag button {
  border: none;
  background: transparent;
  cursor: pointer;
  font-weight: 700;
  line-height: 1;
}

input {
  border: none;
  outline: none;
  flex: 1;
  min-width: 160px;
  padding: 6px 4px;
  font-size: 0.95rem;
}

/* dropdown — абсолютный, не меняет размер родителя */
.suggestions-list {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  max-width: 100%;
  padding: 0.3rem;
  border-radius: 8px;
  margin: 0;
  border: 1px solid var(--color-border, #d0d0d0);
  background-color: #fff;
  box-sizing: border-box;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  z-index: 1200;
  list-style: none;
}

.suggestions-list li {
  padding: 6px 8px;
  cursor: pointer;
  border-radius: 6px;
}

.suggestions-list li.selected {
  background-color: var(--color-primary, #2b7cff);
  color: white;
}

.multiselect-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.multiselect-option input {
  min-width: auto;
  flex: 0;
}

.multiselect-option span {
  flex: 1;
}
</style>
