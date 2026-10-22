<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  message: string, 
  detail: string
}>()
const emits = defineEmits(['close'])

const showDetail = ref(false)
const toggleDetail = () => showDetail.value = !showDetail.value
</script>

<template>
  <div class=" min-w-96">
    <div class=" flex justify-between items-center gap-3">
      <div class=" flex-none p-2 bg-ink-3/10 text-ink-3/50 rounded">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" viewBox="0 0 24 24">
          <path d="M0 0h24v24H0z" fill="none" />
          <g fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11.5" cy="11.5" r="9.5" />
            <path stroke-linecap="round" d="M11.5 15.5C9.84315 15.5 8.5 14.1569 8.5 12.5V10.5M11.5 15.5C13.1569 15.5 14.5 14.1569 14.5 12.5V10.5M11.5 15.5V10.5M14.5 10.5C14.5 8.84315 13.1569 7.5 11.5 7.5C9.84315 7.5 8.5 8.84315 8.5 10.5M14.5 10.5H8.5M14.5715 11.5H16M7 11.5H8.5M14.5 14L15.5 14.5M8.5 14L7.5 14.5M14.5 9L15.5 8.5M8.5 9L7.5 8.5" />
            <path stroke-linecap="round" d="M18.5 18.5L22 22" />
          </g>
        </svg>

      </div>
      <div class=" flex-1 p-2">
        <div class=" text-sm text-ink-2">{{ props.message }}</div>
        <div class=" mt-4 flex items-center justify-end gap-4">
          <button v-if="detail !== ''" type="button" class="btn" @click="toggleDetail">{{ showDetail ? 'Hide' : 'Show' }} Detail</button>
          <button type="button" class="btn btn-primary mr-4" @click="emits('close')">Close</button>
        </div>
      </div>
    </div>
    <div v-if="showDetail" class=" min-h-64 mt-4 p-2 bg-panel text-xs text-gray-500 rounded-md border border-gray-300">
      {{ props.detail }}
    </div>
  </div>
</template>
