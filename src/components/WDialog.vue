<script setup lang="ts">
import { onMounted, useTemplateRef, type Component } from 'vue'

const dlgRef = useTemplateRef('dlgRef')

interface DialogProps {
  title: string,
  content?: Component,
  contentProps?: Object,
}
const { 
  title = '提示',
  content = null,
  contentProps = {},
} = defineProps<DialogProps>()
const emit = defineEmits(['close', 'confirm', 'select'])

onMounted(() => {
  dlgRef.value?.showModal()
})

const handleClose = () => {
  dlgRef.value?.close()
  emit('close')
}
const handleSelect = (value: {close: boolean, payload: any}) => {
  if(value.close) {
    dlgRef.value?.close()
  }
  emit('select', value.payload)
}
const handleConfirm = (payload: any) => {
  dlgRef.value?.close()
  emit('confirm', payload)
}
</script>

<template>
  <dialog ref="dlgRef" class="w-dialog">
    <div class="w-dialog-head">
      <h3 class="modal-title">{{title}}</h3>
      <button type="button" class="btn btn-ghost btn-icon btn-sm" title="Close" @click="handleClose">
        <svg width="15" height="15" viewBox="0 0 256 256" fill="currentColor">
          <path d="M205.66,194.34,139.31,128l66.35-66.34a8,8,0,0,0-11.32-11.32L128,116.69,61.66,50.34A8,8,0,0,0,50.34,61.66L116.69,128,50.34,194.34a8,8,0,0,0,11.32,11.32L128,139.31l66.34,66.35a8,8,0,0,0,11.32-11.32Z"/>
        </svg>
      </button>
    </div>
    <div class="w-dialog-body">
      <component :is="content" v-bind="contentProps" @close="handleClose" @select="handleSelect" @confirm="handleConfirm"></component>
    </div>
  </dialog>
</template>

<style scoped>
.w-dialog {
  border: 0; border-radius: var(--radius-lg); padding: 22px;
  min-width: 24rem; max-width: min(720px, 94vw);
  box-shadow: var(--shadow-lg); color: var(--color-ink-2);
}
.w-dialog::backdrop {
  background: rgba(10, 25, 35, .45);
}
.w-dialog-head {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;
  margin-bottom: 12px;
}
.w-dialog-head .modal-title { margin-bottom: 0; }
</style>