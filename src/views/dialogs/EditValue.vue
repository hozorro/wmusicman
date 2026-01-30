<script setup lang="ts">
import { ref, onMounted, nextTick, useTemplateRef } from 'vue'

const props = defineProps<{
  value: string | number,
  isDifferent: boolean
}>()
const emits = defineEmits(['close', 'confirm', 'select'])
const inputValue = ref<string | number>('')
const inputRef = useTemplateRef('inputRef')
onMounted(() => {
  inputValue.value = props.value
  nextTick(() => inputRef.value?.focus())
})
const handleConfirm = () => {
  if (typeof inputValue.value == 'string') inputValue.value = inputValue.value.trim()
  if (!inputValue.value || inputValue.value == props.value) emits('close')
  emits('confirm', inputValue.value)
}
</script>

<template>
  <div>
    <input v-model="inputValue" ref="inputRef"
      :type="typeof value == 'number' ? 'number' : 'text'"
      :placeholder="isDifferent ? '**多个不同值**' : ''"
      class=" w-full p-2 rounded-md border border-gray-300 focus:border-cyan-500 transition-all outline-none text-gray-800 placeholder:text-gray-600" 
    />
  </div>
  <div class=" mt-4 p-1 text-right">
    <button type="button" class="  h-7 w-28 px-1 mr-2 py-0 disabled:bg-gray-500 disabled:cursor-auto" :disabled="!inputValue || inputValue == value" @click="handleConfirm">Confirm</button>
    <button type="button" class="  h-7 w-28 px-1 py-0" @click="emits('close')">Cancel</button>
  </div>
</template>