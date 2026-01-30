<script setup lang="ts">
import { ref, computed, nextTick, onMounted, useTemplateRef } from 'vue'

const {multiValue = [''], isDifferent = false} = defineProps<{
  multiValue: string[],
  isDifferent?: boolean
}>()
const emits = defineEmits(['close', 'confirm', 'select'])
const inputValues = ref<string[]>([])
const inputsContainer = useTemplateRef('inputsContainer')
const isModified = computed(() => inputValues.value.some((v, i) => v !== multiValue[i]))

onMounted(() => {
  inputValues.value = multiValue.length === 0 ? [''] : [...multiValue] //保证至少有一个输入框, 其实传入数据已有保证，此处双保险
  nextTick(() => {
    if (inputsContainer.value) {
      const inputs = inputsContainer.value.querySelectorAll('input');
      inputs[0].focus();
    }
  })
})
const trimValue = (index: number) => {
  inputValues.value[index] = inputValues.value[index].trim()
}

const validValues = computed(() => {
  return inputValues.value.map(item => item.trim()).filter((val, idx, arr) => arr.indexOf(val) === idx)
})

const handleAddRow = (index: number) => {
  trimValue(index)
  if (!inputValues.value[index]) return
  inputValues.value.splice(index + 1, 0, '')
  nextTick(() => {
    if (inputsContainer.value) {
      const inputs = inputsContainer.value.querySelectorAll('input');
      inputs[index + 1].focus();
    }
  })
}
const handleRemoveRow = (index: number) => {
  inputValues.value.splice(index, 1)
  nextTick(() => {
    if (inputsContainer.value) {
      const inputs = inputsContainer.value.querySelectorAll('input');
      inputs[index - 1].focus();
    }
  })
}
const handleConfirm = () => {
  if (validValues.value.length === 1 && validValues.value[0] == '') emits('close')
  if (JSON.stringify(validValues.value) === JSON.stringify(multiValue)) emits('close')
  emits('confirm', validValues.value)
}
</script>

<template>
  <div class=" space-y-2" ref="inputsContainer">
    <div v-for="(_, index) in inputValues" :key="index" class=" flex items-center gap-2 group">
      <input 
        type="text"
        v-model="inputValues[index]" 
        :placeholder="isDifferent ? '**多个不同值**' : `请输入第 ${index + 1} 个`" 
        class="flex-1 p-2 border-b border-gray-300 focus:border-cyan-500 transition-all outline-none text-gray-800"
        @keydown.enter.prevent="handleAddRow(index)"
        @blur="trimValue(index)"
      />
      <button
        @click="handleAddRow(index)"
        class="w-8 h-8 mr-2 flex items-center justify-center rounded-full bg-gray-100 opacity-0 group-hover:opacity-100 text-gray-500 hover:bg-cyan-100 hover:text-cyan-600 transition-all"
      >
        <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
      </button>
      <button
        @click="handleRemoveRow(index)"
        class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 opacity-0 group-hover:opacity-100 text-gray-500 hover:bg-red-100 hover:text-red-600 transition-all"
        :disabled="inputValues.length <= 1"
      >
        <svg class=" w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
    <div class=" mt-4 p-1 text-right">
      <button type="button" class="  h-7 w-28 px-1 mr-2 py-0 disabled:bg-gray-500 disabled:cursor-auto" :disabled="validValues.length==0 || !isModified" @click="handleConfirm">Confirm</button>
      <button type="button" class="  h-7 w-28 px-1 py-0" @click="emits('close')">Cancel</button>
    </div>
  </div>
</template>