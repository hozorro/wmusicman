<script setup lang="ts">
import { ref, useTemplateRef, nextTick } from 'vue';

const { cellData = '', editAction = 'direct', align = 'left'} = defineProps<{ 
  cellData: string | number, 
  editAction: 'direct' | 'dialog',
  align?: 'left' | 'center' | 'right'
}>();
const isEditing = ref(false);
const tmpData = ref(cellData)
const originalData = ref(cellData)
const editInput = useTemplateRef('editInput')

const emits = defineEmits(['updateValue', 'opendlg'])

function handleDbClick() {
  if (editAction === 'dialog') {
    emits('opendlg')
  } else {
    if (!isEditing.value) {
      isEditing.value = true
      tmpData.value = originalData.value
      nextTick(() => {
        editInput.value?.focus()
      })
    }
  }
}
function handleBlur() {
  if (isEditing.value) {
    isEditing.value = false
    if (tmpData.value !== originalData.value) {
      originalData.value = tmpData.value
      emits('updateValue', tmpData.value)
    }
  }
}
function handleEnter() {
  if (isEditing.value) {
    isEditing.value = false
    if (tmpData.value !== originalData.value) {
      originalData.value = tmpData.value
      emits('updateValue', tmpData.value)
    }
  }
}
</script>

<template>
  <div>
    <div v-if="isEditing" :class="{'text-center': align == 'center', 'text-left': align == 'left', 'text-right': align == 'right'}">
      <input
        type="text"
        ref="editInput"
        class=" w-full p-1 border border-gray-300 rounded-sm text-cyan-600 text-sm"
        v-model="tmpData"
        @blur="handleBlur"
        @keyup.enter="handleEnter"
      />
    </div>
    <div v-else :class="{'text-center': align == 'center', 'text-left': align == 'left', 'text-right': align == 'right'}">
      <span @dblclick="handleDbClick">{{ cellData }}</span>
    </div>
  </div>
</template>