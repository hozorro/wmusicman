<script setup lang="ts">
import { ref, computed, useTemplateRef, inject } from 'vue'
import { useRequest } from 'alova/client';
import { invalidateCache } from 'alova';
import { getServerInfo, initializeMeta, startWatcher, stopWatcher } from '@/apis/methods/manage';
import { barChart } from '@/utils/chart';
import { type ScanState, scanState } from '@/composables/key'
import dayjs from 'dayjs';


const {scanInfo} = inject<ScanState>(scanState) as ScanState

// 服务器信息
const operation_system = ref('')
const python_version = ref('') 
const fastapi_version = ref('')
const server_uptime = ref('')
// 监控状态
const watcher_status = ref<boolean>(false)
const watcher_path = ref('')
// 扫描状态
const scanner_progress = computed(() => { 
  if (scanInfo.value.is_scanning) {
    return `${scanInfo.value.scan_progress.processed} / ${scanInfo.value.scan_progress} (完成/总数)，
    ${scanInfo.value.scan_progress.success} / ${scanInfo.value.scan_progress.failed} (成功/失败)`
  }
  return ''
})
// 基础统计信息
const track_count = ref(0)
const album_count = ref(0)
const artist_count = ref(0)
const folder_count = ref(0)
const genre_count = ref(0)
const playlist_count = ref(0)
const latest_added_tracks = ref<Record<string, number | string>[]>([])
// 播放数据统计信息
const recent_play = ref<Record<string, number>[]>([])
const top_played_artist = ref<Record<string, number | string>[]>([])
const total_played_count = ref(0)

const chartCanvas = useTemplateRef('chart')
const cvWidth = computed(() => { 
  return chartCanvas.value?.offsetWidth
})
const chartData = ref<[string, number | [number, number]][]>([])

const {data:res, send, onSuccess} = useRequest(getServerInfo)
onSuccess(() => { 
  const info = res.value
  if(info.system_status == 'ready') {
    operation_system.value = info.system_info.system
    python_version.value = info.system_info.python_version
    fastapi_version.value = info.system_info.fastapi_version
    server_uptime.value = info.system_info.server_uptime
    watcher_status.value = info.watcher_info.is_running
    watcher_path.value = info.watcher_info.watcher_path
    track_count.value = info.basic_stats.general.track_count
    album_count.value = info.basic_stats.general.album_count
    artist_count.value = info.basic_stats.general.artist_count
    folder_count.value = info.basic_stats.general.folder_count
    genre_count.value = info.basic_stats.general.genre_count
    playlist_count.value = info.basic_stats.general.playlist_count
    latest_added_tracks.value = info.basic_stats.latest_added_tracks_stats
    recent_play.value = info.playback_stats.recent_tracks
    top_played_artist.value = info.playback_stats.top_artists
    total_played_count.value = info.playback_stats.total_played
    const artist_tracks_stats = info.basic_stats.artist_tracks_stats as Record<string, number | string>[]
    chartData.value = artist_tracks_stats.map(item => [item.name as string, item.track_count as number])
    if(chartCanvas.value) {
      barChart(chartCanvas.value, chartData.value)
    }
  }
})
function refreshServerInfo() {
  invalidateCache(getServerInfo())
  send()
}
async function initializeMetaData() { 
  await initializeMeta()
}
async function handleWatcher() {
  if (watcher_status.value) { 
    await stopWatcher()
    watcher_status.value = false
  } else {
    await startWatcher()
    watcher_status.value = true
  }
}
</script>

<template>
  <div class=" my-2">
    <button type="button" class=" mr-2 p-2 w-32" @click="refreshServerInfo">刷新服务器信息</button>
    <button type="button" class=" mr-2 p-2 w-36" @click="initializeMetaData">初始化meta数据</button>
  </div>
  <div class=" h-[calc(100svh_-_6rem)] overflow-y-auto block">
    <div class=" p-2 grid grid-cols-[repeat(auto-fit,minmax(24rem,1fr))] gap-2">
      <div class=" min-w-96 bg-white rounded-md shadow-md p-2 m-2">
        <div class=" text-xl font-bold">系统信息</div>
        <hr class=" my-2 text-gray-300" />
        <ul>
          <li>操作系统：{{ operation_system }}</li>
          <li>Python版本：{{ python_version }}</li>
          <li>FastAPI版本：{{ fastapi_version }}</li>
          <li>服务器运行时间：{{ server_uptime }}</li>
        </ul>
      </div>
      <div class=" min-w-96 bg-white rounded-md shadow-md p-2 m-2">
        <div class=" text-xl font-bold">监控&扫描
          <span class=" ml-3 text-base font-normal">
            <button class=" w-20 h-6 p-0" @click="handleWatcher">{{ watcher_status ? '关闭监控' : '开启监控' }}</button>
          </span>
        </div>
        <hr class=" my-2 text-gray-300" />
        <ul>
          <li>监控状态：{{ watcher_status }}</li>
          <li>监控路径：{{ watcher_path }}</li>
          <li>扫描状态：{{ scanInfo.is_scanning }}</li>
          <li>扫描进度：{{ scanner_progress }}</li>
        </ul>
      </div>
      <div class=" min-w-96 bg-white rounded-md shadow-md p-2 m-2">
        <div class=" text-xl font-bold">基础统计信息</div>
        <hr class=" my-2 text-gray-300" />
        <ul>
          <li>歌曲数量：{{ track_count }}</li>
          <li>专辑数量：{{ album_count }}</li>
          <li>艺术家数量：{{ artist_count }}</li>
          <li>文件夹数量：{{ folder_count }}</li>
          <li>流派数量：{{ genre_count }}</li>
          <li>播放列表数量：{{ playlist_count }}</li>
        </ul>
      </div>
      <div class=" min-w-96 bg-white rounded-md shadow-md p-2 m-2">
        <div class=" text-xl font-bold">最近添加歌曲</div>
        <hr class=" my-2 text-gray-300" />
        <ul>
          <li v-for="item in latest_added_tracks">{{ item.title }}
            <span class=" text-sm text-gray-500">({{ dayjs(item.created_at).format('YYYY-MM-DD') }})</span>
          </li>
        </ul>
      </div>
      <div class=" min-w-96 bg-white rounded-md shadow-md p-2 m-2">
        <div class=" text-xl font-bold">歌曲播放信息</div>
        <hr class=" my-2 text-gray-300" />
        <ul>
          <li>总播放次数：{{ total_played_count }}</li>
          <li v-for="item in recent_play">{{ item.title }}</li>
        </ul>
      </div>
      <div class=" min-w-96 bg-white rounded-md shadow-md p-2 m-2">
        <div class=" text-xl font-bold">歌手播放信息</div>
        <hr class=" my-2 text-gray-300" />
        <ul>
          <li v-for="item in top_played_artist">{{ item.name }} ({{ item.play_count }}次)</li>
        </ul>
      </div>
    </div>
    <div class=" mt-2 w-full rounded-md shadow-md">
      <canvas ref="chart" class=" w-full h-[300px]" :width="cvWidth" height="300"></canvas>
    </div>
  </div>
</template>