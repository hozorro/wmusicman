<script setup lang="ts">
import { ref } from 'vue'
import { getLogs } from '@/apis/methods/manage'

const logs = ref<string[]>()
function handleLogs() {
  getLogs().then(res => {
    logs.value = res.data
  })
}
</script>
<template>
  <div class=" flex flex-col h-full">
    <div class=" my-2 flex-1">
      <button type="button" class=" mr-2 p-2 w-28" @click="handleLogs">获取日志</button>
    </div>
    <div class=" mt-2 w-full h-full overflow-y-auto">
      <ul>
        <li v-for="(l,i) in logs" :key="i">{{ l }}</li>
      </ul>
    </div>
  </div>
</template>