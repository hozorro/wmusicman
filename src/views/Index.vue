<script setup lang="ts">
import { ref, computed, useTemplateRef, inject } from 'vue'
import { useRequest } from 'alova/client';
import { getServerInfo } from '@/apis/methods/manage';
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
    return `${scanInfo.value.scan_progress.processed} / ${scanInfo.value.scan_progress.total} (完成/总数)，
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
const recent_play = ref<Record<string, number | string>[]>([])
const top_played_artist = ref<Record<string, number | string>[]>([])
const total_played_count = ref(0)

const chartCanvas = useTemplateRef('chart')
const cvWidth = computed(() => { 
  return chartCanvas.value?.offsetWidth
})
const chartData = ref<[string, number | [number, number]][]>([])

const {data:res, onSuccess} = useRequest(getServerInfo)
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
</script>

<template>
  <div class="flex flex-col gap-4 animate-fade-in">
    <!-- 页头 -->
    <div class="page-head">
      <div>
        <h1>仪表盘</h1>
        <p>系统概览与音乐库基础统计</p>
      </div>
    </div>

    <!-- 基础统计 KPI -->
    <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
      <div class="kpi">
        <div class="kpi-k">歌曲数量</div>
        <div class="kpi-v">{{ track_count }}</div>
      </div>
      <div class="kpi">
        <div class="kpi-k">专辑数量</div>
        <div class="kpi-v">{{ album_count }}</div>
      </div>
      <div class="kpi">
        <div class="kpi-k">艺术家数量</div>
        <div class="kpi-v">{{ artist_count }}</div>
      </div>
      <div class="kpi">
        <div class="kpi-k">文件夹数量</div>
        <div class="kpi-v">{{ folder_count }}</div>
      </div>
      <div class="kpi">
        <div class="kpi-k">流派数量</div>
        <div class="kpi-v">{{ genre_count }}</div>
      </div>
      <div class="kpi">
        <div class="kpi-k">播放列表数量</div>
        <div class="kpi-v">{{ playlist_count }}</div>
      </div>
    </div>

    <div class="grid grid-cols-[repeat(auto-fit,minmax(24rem,1fr))] gap-4">
      <!-- 系统信息 -->
      <div class="card">
        <div class="card-header"><h2>系统信息</h2></div>
        <div class="card-pad">
          <div class="setting-row"><div class="info"><b>操作系统</b></div><span class="text-[13px] text-ink-2 num">{{ operation_system }}</span></div>
          <div class="setting-row"><div class="info"><b>Python 版本</b></div><span class="text-[13px] text-ink-2 num">{{ python_version }}</span></div>
          <div class="setting-row"><div class="info"><b>FastAPI 版本</b></div><span class="text-[13px] text-ink-2 num">{{ fastapi_version }}</span></div>
          <div class="setting-row"><div class="info"><b>服务器运行时间</b></div><span class="text-[13px] text-ink-2 num">{{ server_uptime }}</span></div>
        </div>
      </div>

      <!-- 监控&扫描 -->
      <div class="card">
        <div class="card-header">
          <h2>监控&amp;扫描</h2>
        </div>
        <div class="card-pad">
          <div class="setting-row"><div class="info"><b>监控路径</b><span class="block truncate max-w-64">{{ watcher_path }}</span></div></div>
          <div class="setting-row">
            <div class="info"><b>扫描状态</b></div>
            <span class="tag" :class="scanInfo.is_scanning ? 'tag-cyan' : 'tag-gray'">{{ scanInfo.is_scanning ? 'Scanning' : 'Idle' }}</span>
          </div>
          <div class="setting-row"><div class="info"><b>扫描进度</b><span class="text-ink-3 num">{{ scanner_progress || '-' }}</span></div></div>
        </div>
      </div>

      <!-- 最近添加歌曲 -->
      <div class="card">
        <div class="card-header"><h2>最近添加歌曲</h2></div>
        <div class="card-pad flex flex-col gap-1.5">
          <div v-for="item in latest_added_tracks" :key="item.name as string" class="flex items-center gap-2 text-[13.5px]">
            <span class="text-ink-2 flex-1 truncate">{{ item.title }}</span>
            <span class="tag tag-gray num">{{ dayjs(item.created_at).format('YYYY-MM-DD') }}</span>
          </div>
          <div v-if="!latest_added_tracks.length" class="state-box !py-8">暂无数据</div>
        </div>
      </div>
    </div>

    <!-- 播放统计 -->
    <div class="two-col">
      <div class="card">
        <div class="card-header"><h2>歌曲播放信息</h2><span class="sp tag tag-cyan num">总播放 {{ total_played_count }}</span></div>
        <div class="card-pad flex flex-col gap-1.5">
          <div v-for="item in recent_play" :key="item.name as string" class="flex items-center gap-2 text-[13.5px]">
            <span class="text-ink-2 flex-1 truncate">{{ item.title }}</span>
            <span class="tag tag-gray num">{{ dayjs(item.played_at).format('YYYY-MM-DD') }}</span>
          </div>
          <div v-if="!recent_play.length" class="text-ink-3 text-[13px]">暂无播放记录</div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h2>歌手播放信息</h2></div>
        <div class="card-pad flex flex-col gap-1.5">
          <div v-for="item in top_played_artist" :key="item.name as string" class="flex items-center gap-2 text-[13.5px]">
            <span class="text-ink-2 flex-1 truncate">{{ item.name }}</span>
            <span class="tag tag-gray num">{{ item.play_count }}次</span>
          </div>
          <div v-if="!top_played_artist.length" class="text-ink-3 text-[13px]">暂无数据</div>
        </div>
      </div>
    </div>

    <!-- 柱状图 -->
    <div class="chart-box">
      <header><h3>歌手曲目统计</h3></header>
      <canvas ref="chart" class="w-full h-[300px]" :width="cvWidth" height="300"></canvas>
    </div>
  </div>
</template>