<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import { busyState, type BusyState } from '@/composables/busy'
import {
  getTmpPlaylistJsons, getCurrentPlaylists, getAllPlaylists, backupPlaylist,
  createPlaylistFromJson, deleteJson,
} from '@/apis/methods/manage'
import { saveBlob, getFilenameFromHeaders } from '@/utils/download'
import { toast } from '@/composables/toast'
import PlaylistImportPanel from '@/components/PlaylistImportPanel.vue'

// While any global task is running, create/backup/delete entries are disabled
const busy = inject<BusyState | null>(busyState, null)?.busy ?? computed(() => false)

const activeTab = ref<'create' | 'backup'>('create')
const backupScope = ref<'cur' | 'all'>()
const jsonLists = ref<PlaylistJson[]>()
const userPlaylists = ref<PlaylistBackupInfo[]>()

function getJsonList() {
  getTmpPlaylistJsons().then((data) => {
    if (!data?.length) {
      jsonLists.value = []
      toast('没有待创建的 Playlist', 'info')
      return
    }
    jsonLists.value = data
    jsonLists.value.forEach(jf => { jf.show = false })
  })
}
function getCurUserPlaylists() {
  getCurrentPlaylists().then((data) => {
    userPlaylists.value = data ?? []
    userPlaylists.value.forEach(pl => { pl.show = false })
    backupScope.value = 'cur'
  })
}
function getAllUserPlaylists() {
  getAllPlaylists().then((data) => {
    userPlaylists.value = data ?? []
    userPlaylists.value.forEach(pl => { pl.show = false })
    backupScope.value = 'all'
  })
}
async function bkPlaylist(id: number) {
  const res: any = await backupPlaylist(id).send()
  saveBlob(res.data, getFilenameFromHeaders(res.headers, `playlist_${id}.json`))
  toast(`歌单 ${id} 已备份`, 'success')
}
async function createPlaylist(filename: string) {
  const res = await createPlaylistFromJson(filename)
  toast(res)
}
function delJson(filename: string) {
  deleteJson(filename).then((data) => {
    if (data) {
      toast(`${data} deleted!`, 'success')
      getJsonList()
    }
  })
}
</script>

<template>
  <div class="flex flex-col gap-4 animate-fade-in pl-hero">
    <div class="page-head">
      <div>
        <h1>Playlist</h1>
        <p>创建歌单、导入 JSON 匹配歌曲，以及备份用户歌单</p>
      </div>
      <div class="sp actions">
        <div class="seg" role="tablist" aria-label="Playlist 功能区">
          <button type="button" role="tab" :aria-selected="activeTab === 'create'"
                  :class="{ 'seg-on': activeTab === 'create' }" @click="activeTab = 'create'">创建歌单</button>
          <button type="button" role="tab" :aria-selected="activeTab === 'backup'"
                  :class="{ 'seg-on': activeTab === 'backup' }" @click="activeTab = 'backup'">备份歌单</button>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'create'" class="flex flex-col gap-4 pl-tab-pane">
      <div class="card">
        <div class="card-header flex items-center gap-2">
          <h2>待创建的 Playlist</h2>
          <span class="sp"></span>
          <button type="button" class="btn btn-sm" :disabled="busy" @click="getJsonList">刷新列表</button>
        </div>
        <div class="card-pad flex flex-col gap-2">
          <div v-for="(jf, i) in jsonLists" :key="i" class="pl-item">
            <div class="flex items-center gap-3">
              <button type="button" class="btn btn-icon btn-sm" @click="jf.show = !jf.show" title="展开/收起">
                <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" :class="{ 'rotate-180': jf.show }" class="transition-transform">
                  <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
                </svg>
              </button>
              <span class="tag tag-cyan">{{ jf.source }}</span>
              <span class="font-semibold text-ink-1">{{ jf.title }} <span class="text-ink-3 num">({{ jf.tracks.length }})</span></span>
              <span class="text-[12.5px] text-ink-3">{{ jf.username }}</span>
              <span class="sp"></span>
              <button type="button" class="btn btn-primary btn-sm" :disabled="busy" @click="createPlaylist(jf.filename)">创建</button>
              <button type="button" class="btn btn-danger btn-sm" :disabled="busy" @click="delJson(jf.filename)">删除</button>
            </div>
            <div v-show="jf.show" class="pl-expand">
              <ul class="text-[12.5px] text-ink-2 space-y-1">
                <li v-for="(f, j) in jf.tracks" :key="j" class="truncate">{{ f }}</li>
              </ul>
            </div>
          </div>
          <div v-if="!jsonLists?.length" class="state-box !py-8">
            <b>{{ jsonLists ? '没有待创建的 Playlist' : '尚未加载待创建的 Playlist' }}</b>
            <span>{{ jsonLists ? '在 Transfer 页面入库文件时设置歌单名，即可在此创建' : '点击「刷新列表」加载由 Transfer 生成的待创建歌单' }}</span>
          </div>
        </div>
      </div>

      <div class="pl-section">
        <div class="pl-section-title">导入 JSON 创建歌单</div>
        <PlaylistImportPanel />
      </div>
    </div>

    <div v-else class="flex flex-col gap-4 pl-tab-pane">
      <div class="card">
        <div class="card-header flex items-center gap-2">
          <h2>歌单备份</h2>
          <span class="sp"></span>
          <button type="button" class="btn btn-sm" :class="{ 'btn-primary': backupScope === 'cur' }"
                  :disabled="busy" @click="getCurUserPlaylists">当前用户的 Playlist</button>
          <button type="button" class="btn btn-sm" :class="{ 'btn-primary': backupScope === 'all' }"
                  :disabled="busy" @click="getAllUserPlaylists">所有用户的 Playlist</button>
        </div>
        <div class="card-pad flex flex-col gap-2">
          <div v-for="(pl, i) in userPlaylists" :key="i" class="pl-item">
            <div class="flex items-center gap-3">
              <button type="button" class="btn btn-icon btn-sm" @click="pl.show = !pl.show" title="展开/收起">
                <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" :class="{ 'rotate-180': pl.show }" class="transition-transform">
                  <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
                </svg>
              </button>
              <span class="text-sm font-semibold text-ink-2">{{ pl.title }} <span class="num">({{ pl.tracks.length }})</span></span>
              <span class="tag tag-info text-[12.5px] text-ink-3">{{ pl.username }}</span>
              <span class="sp"></span>
              <button type="button" class="btn btn-sm" :disabled="busy" @click="bkPlaylist(pl.id)">备份</button>
            </div>
            <div v-show="pl.show" class="pl-expand">
              <ul class="space-y-1">
                <li v-for="(t, j) in pl.tracks" :key="j" class="truncate">
                  <span class="text-sm mr-2 num">{{ j + 1 }}</span>
                  <span class="text-sm text-ink-2 mr-1">{{ t.title }}</span>
                  <span class="text-xs text-ink-3">{{ t.artists.join(',') }}</span>
                </li>
              </ul>
            </div>
          </div>
          <div v-if="!userPlaylists?.length" class="state-box !py-12">
            <div class="ico">
              <svg width="24" height="24" viewBox="0 0 256 256" fill="currentColor"><path d="M226.53,56.87l-96-32a8,8,0,0,0-5.06,0l-96,32A8,8,0,0,0,24,64.5V192a8,8,0,0,0,8,8h192a8,8,0,0,0,8-8V64.5A8,8,0,0,0,226.53,56.87ZM128,184a32,32,0,0,1-32-32V105.63l64-21.34V152A32,32,0,0,1,128,184Z"></path></svg>
            </div>
            <b>{{ userPlaylists ? '没有 Playlist 数据' : '选择歌单范围开始' }}</b>
            <span>点击右上角按钮加载当前用户或所有用户的歌单</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pl-hero .page-head { position: relative; }
.pl-hero .page-head::before {
  content: ''; position: absolute; inset: -18px -18px auto -18px; height: 104px;
  background: radial-gradient(ellipse at top left, rgba(99, 102, 241, .12), transparent 70%);
  pointer-events: none;
}
.pl-tab-pane { animation: pl-fade .24s ease both; }
@keyframes pl-fade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
.pl-section { display: flex; flex-direction: column; gap: 10px; }
.pl-section-title {
  position: relative; padding-left: 12px; font-size: 13.5px; font-weight: 600; color: #475569;
}
.pl-section-title::before {
  content: ''; position: absolute; left: 0; top: 2px; bottom: 2px; width: 3px;
  border-radius: 3px; background: linear-gradient(180deg, #4F46E5, #818CF8);
}
.pl-item {
  border: 1px solid rgba(148, 163, 184, .22); border-radius: 10px; padding: 8px 12px;
  background: #fff; transition: border-color .15s, box-shadow .15s;
}
.pl-item:hover { border-color: rgba(99, 102, 241, .45); box-shadow: 0 2px 10px rgba(79, 70, 229, .06); }
.pl-expand { margin-top: 8px; padding: 10px 12px; border-top: 1px solid rgba(148, 163, 184, .18); background: rgba(248, 250, 252, .8); border-radius: 0 0 8px 8px; }
</style>
