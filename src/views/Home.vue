<script setup lang="ts">
import { ref, computed } from 'vue'
import { getServerInfo } from '@/apis/methods/manage';

const version = ref('')
const music_buffer = ref('')
const music_root = ref('')
const music_root_name = ref('')
const stats = ref({})
const status = ref({})
const flashMsg = ref('')
const displayFlash = computed(() => {
  if(flashMsg.value != ''){
    return 'block'
  }else{
    return 'none'
  }
})
async function loadServerInfo() {
  let res = await getServerInfo()
  if(res.code == 200){
    if(res.msg != 'ok'){
      flashMsg.value = res.msg
      setTimeout(() => {
        flashMsg.value = ''
      }, 3000)
    }
    version.value = res.data.version
    music_buffer.value = res.data.music_buffer
    music_root.value = res.data.music_root
    music_root_name.value = res.data.music_root_name
    stats.value = res.data.stats
    status.value = res.data.status
  }
}
</script>

<template>
  <div class=" absolute top-0 left-0 hidden w-full h-10 p-2 bg-red-100 rounded-md shadow-md" :style="{display:displayFlash}">{{ flashMsg }}</div>
  <div class=" my-2">
    <button type="button" class=" mr-2 p-2 w-28" @click="loadServerInfo">服务器信息</button>
  </div>
  <div class=" h-[calc(100svh_-_6rem)] overflow-y-auto block">
    <div class=" p-2 flex flex-wrap">
      <div class=" w-96 bg-white rounded-md shadow-md p-2 m-2">
        <div class=" text-xl font-bold">Configuration</div>
        <hr class=" my-2 text-gray-300" />
        <ul>
          <li>Version: <span class=" text-gray-500">{{ version }}</span></li>
          <li>Root Path: <span class=" text-gray-500">{{ music_root }}</span></li>
          <li>Root Name: <span class=" text-gray-500">{{ music_root_name }}</span></li>
          <li>Buffer Path: <span class=" text-gray-500">{{ music_buffer }}</span></li>
        </ul>
      </div>
      <div class=" w-96 bg-white rounded-md shadow-md p-2 m-2">
        <div class=" text-xl font-bold">Server Status</div>
        <hr class=" my-2 text-gray-300" />
        <ul>
          <li v-for="(value, key) in status" :key="key">{{ key }}: <span class=" text-gray-500">{{ value }}</span></li>
        </ul>
      </div>
      <div class=" w-96 bg-white rounded-md shadow-md p-2 m-2">
        <div class=" text-xl font-bold">Database Statistics</div>
        <hr class=" my-2 text-gray-300" />
        <ul>
          <li v-for="(value, key) in stats" :key="key">{{ key }}: <span class=" text-gray-500">{{ value }}</span></li>
        </ul>
      </div>
    </div>
  </div>
</template>