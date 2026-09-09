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
  <dialog ref="dlgRef" class=" border-0 rounded-md p-2 min-w-96 backdrop:bg-gray-500/50 top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%]">
    <div class=" flex justify-between items-center p-2 border-b border-b-gray-200">
      <h3 class=" text-base font-medium">{{title}}</h3>
      <button type="button" class="btn btn-ghost btn-icon btn-sm" title="Close" @click="handleClose">
        <svg width="15" height="15" viewBox="0 0 256 256" fill="currentColor">
          <path d="M205.66,194.34,139.31,128l66.35-66.34a8,8,0,0,0-11.32-11.32L128,116.69,61.66,50.34A8,8,0,0,0,50.34,61.66L116.69,128,50.34,194.34a8,8,0,0,0,11.32,11.32L128,139.31l66.34,66.35a8,8,0,0,0,11.32-11.32Z"/>
        </svg>
      </button>
    </div>
    <div class=" p-2">
      <component :is="content" v-bind="contentProps" @close="handleClose" @select="handleSelect" @confirm="handleConfirm"></component>
    </div>
  </dialog>
</template>