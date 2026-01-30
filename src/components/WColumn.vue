<script setup lang="ts">
import { ref } from 'vue';
import WCell from './WCell.vue';

interface Props {
  scope?: Record<string, any>;
  prop?: any;
  width?: string;
  label?: string;
  align?: 'left' | 'center' | 'right';
  rowSelectable?: boolean;
  columnEditable?: boolean;
  cellEditable?: 'direct' | 'dialog';
  sortable?: boolean;
  transform?: (value: any) => any;
}

const props = withDefaults(defineProps<Props>(), {
  transform: (value: any) => value
})
const rowSelected = defineModel<Array<any>>('rowSelected', {default: []});
const allSelected = defineModel<boolean>('allSelected', {default:false});
const sortAscend = ref(false)
const sortField = ref('')
const emits = defineEmits(['toggleAllSelection', 'editColumn', 'openCellEditDlg', 'updateValue', 'sortData'])

function toggleRowSelection() {
  rowSelected.value.includes(props.scope?.id) ? rowSelected.value.splice(rowSelected.value.indexOf(props.scope?.id), 1) : rowSelected.value.push(props.scope?.id)
}
function toggleAllRowsSelection() {
  emits('toggleAllSelection')
}
function handleOpenDlg() {
  emits('openCellEditDlg', props.scope?.id, props.prop)
}
function handleUpdateValue(value: string) {
  emits('updateValue', {key: props.scope?.id, field: props.prop, value})
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
      <div class=" text-center">
        <input type="checkbox" :checked="rowSelected.includes(scope.id)" @change="toggleRowSelection()">
      </div>
    </template>
    <template v-else>
      <template v-if="prop">
        <template v-if="cellEditable">
          <WCell :align="align"
            :cellData="props.transform(scope[prop])" 
            :editAction="cellEditable" 
            @opendlg="handleOpenDlg" 
            @updateValue="handleUpdateValue" 
          />
        </template>
        <template v-else>
          <div :class="{'text-center': align == 'center', 'text-left': align == 'left', 'text-right': align == 'right'}">
            {{ props.transform(scope[prop]) }}
          </div>
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
        <th :style="{ width: width }" class=" py-1">
          <button type="button" class=" h-6 px-1 py-0" @click="emits('editColumn', prop)">{{ label }}</button>
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