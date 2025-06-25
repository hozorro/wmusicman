<script setup lang="ts">
import { ref } from 'vue';
import WCell from './WCell.vue';

interface Props {
  scope?: Record<string, any>;
  prop?: keyof TrackFile | keyof Track;
  width?: string;
  label?: string;
  rowSelectable?: boolean;
  columnEditable?: boolean;
  cellEditable?: boolean;
  sortable?: boolean;
}

const props = defineProps<Props>()
const rowSelected = defineModel<Array<any>>('rowSelected', {default: []});
const allSelected = defineModel<boolean>('allSelected', {default:false});
const sortAscend = ref(false)
const sortField = ref('')
const emits = defineEmits(['toggleAllSelection', 'editColumn', 'updateValue', 'sortData'])

function toggleRowSelection() {
  rowSelected.value.includes(props.scope?.path) ? rowSelected.value.splice(rowSelected.value.indexOf(props.scope?.path), 1) : rowSelected.value.push(props.scope?.path)
}
function toggleAllRowsSelection() {
  emits('toggleAllSelection')
}
function handleUpdateValue(value: string) {
  emits('updateValue', {path: props.scope?.path, field: props.prop, value})
}
function changeSort(field: string) {
  sortAscend.value = sortField.value === field ? !sortAscend.value : true
  sortField.value = field
  emits('sortData', {field, ascend: sortAscend.value})
}
</script>

<template>
  <template v-if="scope"> <!-- Body -->
    <template v-if="rowSelectable">
      <input type="checkbox" :checked="rowSelected.includes(scope.path)" @change="toggleRowSelection()">
    </template>
    <template v-else>
      <template v-if="prop">
        <template v-if="cellEditable">
          <WCell :cellData="scope[prop]" @updateValue="handleUpdateValue" />
        </template>
        <template v-else>
          {{ scope[prop] }}
        </template>
      </template>
      <template v-else>
        <slot :row="scope"></slot>
      </template>
    </template>
  </template>
  <template v-else> <!-- Header -->
    <template v-if="rowSelectable">
      <th :style="{ width: width }">
        <input type="checkbox" :checked="allSelected" @change="toggleAllRowsSelection">
      </th>
    </template>
    <template v-else>
      <template v-if="columnEditable">
        <th :style="{ width: width }">
          <button type="button" class=" border rounded-b-sm" @click="emits('editColumn', prop)">{{ label }}</button>
          <span v-if="sortable" class=" ml-1 inline-block cursor-pointer" @click="changeSort(prop as string)">{{ sortAscend ? '▲' : '▼' }}</span>
        </th>
      </template>
      <template v-else>
        <th :style="{ width: width }">
          {{ label }}
          <span v-if="sortable" class=" ml-1 inline-block cursor-pointer" @click="changeSort(prop as string)">{{ sortAscend ? '▲' : '▼' }}</span>
        </th>
      </template>
    </template>
  </template>
</template>