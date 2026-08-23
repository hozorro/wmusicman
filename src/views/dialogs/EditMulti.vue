<script setup lang="ts">
import { ref, computed, nextTick, onMounted, useTemplateRef, inject } from 'vue'
import { busyState, type BusyState } from '@/composables/busy'

// While any global task is running, submit is disabled (read-only)
const busy = inject<BusyState | null>(busyState, null)?.busy ?? computed(() => false)

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
  <div class="space-y-2" ref="inputsContainer">
    <div v-for="(_, index) in inputValues" :key="index" class="flex items-center gap-2 group">
      <input 
        type="text"
        v-model="inputValues[index]" 
        :placeholder="isDifferent ? '**多个不同值**' : `请输入第 ${index + 1} 个`" 
        class="input flex-1"
        :disabled="busy"
        @keydown.enter.prevent="handleAddRow(index)"
        @blur="trimValue(index)"
      />
      <button
        @click="handleAddRow(index)"
        class="btn btn-icon btn-sm opacity-0 group-hover:opacity-100 transition-opacity"
        :disabled="busy"
        title="添加一行"
      >
        <svg width="15" height="15" viewBox="0 0 256 256" fill="currentColor">
          <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
        </svg>
      </button>
      <button
        @click="handleRemoveRow(index)"
        class="btn btn-icon btn-sm opacity-0 group-hover:opacity-100 transition-opacity !text-bad"
        :disabled="busy || inputValues.length <= 1"
        title="删除此行"
      >
        <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
          <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
        </svg>
      </button>
    </div>
    <div class="mt-5 flex justify-end gap-2">
      <button type="button" class="btn" @click="emits('close')">Cancel</button>
      <button type="button" class="btn btn-primary" :disabled="busy || validValues.length==0 || !isModified" @click="handleConfirm">Confirm</button>
    </div>
  </div>
</template>