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
      <h3 class=" text-lg">{{title}}</h3>
      <span class=" w-8 h-5 text-amber-500 cursor-pointer" @click="handleClose">关闭</span>
    </div>
    <div class=" p-2">
      <component :is="content" v-bind="contentProps" @close="handleClose" @select="handleSelect" @confirm="handleConfirm"></component>
    </div>
  </dialog>
</template>