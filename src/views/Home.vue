<script setup lang="ts">
import { ref, computed, useTemplateRef, onMounted } from 'vue'
import { useRequest } from 'alova/client';
import { getServerInfo, clearMoveMode, getDbMetaInfo, getArtistStatistics } from '@/apis/methods/manage';
import { invalidateCache } from 'alova';
import { barChart } from '@/utils/chart';
import { timeStampToDate } from '@/utils/general';

const version = ref('')
const music_buffer = ref('')
const music_root = ref('')
const music_root_name = ref('')
const stats = ref({})
const status = ref<ServerStatus>()
const flashMsg = ref('')
const displayFlash = computed(() => {
  if(flashMsg.value != ''){
    return 'block'
  }else{
    return 'none'
  }
})

const {data:res, send, onSuccess} = useRequest(getServerInfo)
onSuccess(() => {
  if(res.value.code == 200){
    if(res.value.msg != 'ok'){
      flashMsg.value = res.value.msg
      setTimeout(() => {
        flashMsg.value = ''
      }, 3000)
    }
    version.value = res.value.data.version
    music_buffer.value = res.value.data.music_buffer
    music_root.value = res.value.data.music_root
    music_root_name.value = res.value.data.music_root_name
    stats.value = res.value.data.stats
    status.value = res.value.data.status
  }
})
function refreshServerInfo() {
  invalidateCache(getServerInfo())
  send()
}
function handleClearMoveMode() {
  clearMoveMode().then((res) => {
    if(res.code == 200){
      invalidateCache(getServerInfo())
      send()
    }
  })
}

const metaInfo = ref<IMetaInfo>({
  schema_version: 0,
  play_data_version: 0,
  folder: {last_scan: 0, count: 0},
  track: {last_scan: 0, count: 0},
  artist: {last_scan: 0, count: 0},
  album: {last_scan: 0, count: 0},
  genre: {last_scan: 0, count: 0},
  playlist: {last_scan: 0, count: 0},
})
getDbMetaInfo().then((res) => {
  if(res.code == 200){
    metaInfo.value = res.data
  }
})
function transformValue(value: number | {last_scan: number, count: number}) {
  if(typeof value == 'number'){
    return timeStampToDate(value)
  }else{
    return value.count + ', ' + timeStampToDate(value.last_scan)
  }
}

const chartCanvas = useTemplateRef('chart')
const cvWidth = computed(() => { 
  return chartCanvas.value?.offsetWidth
})
let data = ref<[string, number | [number,number]][]>([])
onMounted(() => {
  getArtistStatistics().then((res) => { 
    if(res.code == 200){
      data.value = res.data.map(item => [item.name, item.count])
      if(chartCanvas.value) barChart(chartCanvas.value, data.value)
    }
  })
})

</script>

<template>
  <div class=" absolute top-0 left-0 hidden w-full h-10 p-2 bg-red-100 rounded-md shadow-md" :style="{display:displayFlash}">{{ flashMsg }}</div>
  <div class=" my-2">
    <button type="button" class=" mr-2 p-2 w-32" @click="refreshServerInfo">刷新服务器信息</button>
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
          <li>Scanner: <span class=" text-gray-500">{{ status?.scanner }}</span></li>
          <li>
            Watcher: <span class=" text-gray-500">{{ status?.watcher }}</span>
            <ul class=" ml-2">
              <li>
                Move mode: <span class=" text-gray-500">{{ status?.move_mode }}</span>
                <span class=" ml-2 cursor-pointer rounded-md bg-cyan-700 text-white px-2 py-1" @click="handleClearMoveMode">Clear</span>
              </li>
              <li>
                Cut files: <span class=" text-gray-500">{{ status?.cut_files }}</span>
              </li>
            </ul>
          </li>
        </ul>
      </div>
      <div class=" w-96 bg-white rounded-md shadow-md p-2 m-2">
        <div class=" text-xl font-bold">Database Statistics</div>
        <hr class=" my-2 text-gray-300" />
        <ul>
          <li v-for="(value, key) in stats" :key="key">{{ key }}: <span class=" text-gray-500">{{ value }}</span></li>
        </ul>
      </div>
      <div class=" w-96 bg-white rounded-md shadow-md p-2 m-2">
        <div class=" text-xl font-bold">Database Meta Info</div>
        <hr class=" my-2 text-gray-300" />
        <ul>
          <li v-for="(value, key) in metaInfo" :key="key">{{ key }}: <span class=" text-gray-500">{{ transformValue(value) }}</span></li>
        </ul>
      </div>
    </div>
    <div class=" mt-2 p-2 w-full rounded-md shadow-md">
      <canvas ref="chart" class=" w-full h-[300px]" :width="cvWidth" height="300"></canvas>
    </div>
  </div>
</template>