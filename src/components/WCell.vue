<script setup lang="ts">
import { ref, computed, inject, useTemplateRef, nextTick } from 'vue';
import { busyState, type BusyState } from '@/composables/busy';

const { cellData = '', editAction = 'direct', align = 'left'} = defineProps<{ 
  cellData: string | number, 
  editAction: 'direct' | 'dialog',
  align?: 'left' | 'center' | 'right'
}>();
// While a global task (scan / artwork rebuild) is running, cells stay read-only.
const busy = inject<BusyState | null>(busyState, null)?.busy ?? computed(() => false)
const isEditing = ref(false);
const tmpData = ref(cellData)
const originalData = ref(cellData)
const editInput = useTemplateRef('editInput')

const emits = defineEmits(['updateValue', 'opendlg'])

function handleDbClick() {
  if (busy.value) return
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
        class="input py-0.5 px-2 text-[13px] text-accent"
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