<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import { busyState, type BusyState } from '@/composables/busy'
import { getTmpPlaylistJsons, getCurrentPlaylists, getAllPlaylists, backupPlaylist, createPlaylistFromJson, deleteJson } from '@/apis/methods/manage'

// While any global task is running, create/backup/delete entries are disabled
const busy = inject<BusyState | null>(busyState, null)?.busy ?? computed(() => false)

const jsonLists = ref<PlaylistJson[]>()
const userPlaylists = ref<PlaylistBackupInfo[]>()
const listCate = ref<'json'|'playlist'|'hit'|'fav'>()

function getJsonList(){
  getTmpPlaylistJsons().then((data) => {
    jsonLists.value = data  
    jsonLists.value.forEach(jf => {
      jf.show = false
    })
    listCate.value = 'json'
  })
}
function getCurUserPlaylists() {
  getCurrentPlaylists().then((data) => {
    userPlaylists.value = data
      userPlaylists.value.forEach(pl => {
      pl.show = false
    })
    listCate.value = 'playlist'
  })
}
function getAllUserPlaylists() {
  getAllPlaylists().then((data) => {
    userPlaylists.value = data
    userPlaylists.value.forEach(pl => {
      pl.show = false
    })
    listCate.value = 'playlist'
  })
}
async function bkPlaylist(id: number){
  const res = await backupPlaylist(id)
  alert(res)
}
async function createPlaylist(filename: string){
  const res = await createPlaylistFromJson(filename)
  alert(res)
}
function delJson(filename: string){
  deleteJson(filename).then((data) => {
    if(data){
      alert(`${data} deleted!`)
      getJsonList()
    }
  })
}

</script>

<template>
  <div class="flex flex-col gap-4 animate-fade-in">
    <div class="page-head">
      <div>
        <h1>Playlist</h1>
        <p>查看、创建与备份用户歌单</p>
      </div>
      <div class="sp actions">
        <button type="button" class="btn" @click="getJsonList">待创建的 Playlist</button>
        <button type="button" class="btn" @click="getCurUserPlaylists">当前用户的 Playlist</button>
        <button type="button" class="btn" @click="getAllUserPlaylists">所有用户的 Playlist</button>
      </div>
    </div>

    <div v-if="listCate == 'json'" class="flex flex-col gap-3">
      <div v-for="(jf,i) in jsonLists" :key="i" class="card">
        <div class="card-pad !py-3 flex items-center gap-3">
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
        <div v-show="jf.show" class="border-t border-line bg-panel rounded-b-lg px-5 py-3">
          <ul class="text-[12.5px] text-ink-2 space-y-1">
            <li v-for="(f,j) in jf.tracks" :key="j" class="truncate">{{ f }}</li>
          </ul>
        </div>
      </div>
      <div v-if="!jsonLists?.length" class="card"><div class="state-box !py-8">没有待创建的 Playlist</div></div>
    </div>

    <div v-else-if="listCate == 'playlist'" class="flex flex-col gap-3">
      <div v-for="(pl,i) in userPlaylists" :key="i" class="card">
        <div class="card-pad !py-3 flex items-center gap-3">
          <button type="button" class="btn btn-icon btn-sm" @click="pl.show = !pl.show" title="展开/收起">
            <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" :class="{ 'rotate-180': pl.show }" class="transition-transform">
              <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
            </svg>
          </button>
          <span class="tag tag-info">{{ pl.title }} <span class="num">({{ pl.tracks.length }})</span></span>
          <span class="text-[12.5px] text-ink-3">{{ pl.username }}</span>
          <span class="sp"></span>
          <button type="button" class="btn btn-sm" :disabled="busy" @click="bkPlaylist(pl.id)">备份</button>
        </div>
        <div v-show="pl.show" class="border-t border-line bg-panel rounded-b-lg px-5 py-3">
          <ul class="text-[12.5px] text-ink-2 space-y-1">
            <li v-for="(t,j) in pl.tracks" :key="j" class="truncate">{{ t.title }} - {{ t.artists.join(',') }}</li>
          </ul>
        </div>
      </div>
      <div v-if="!userPlaylists?.length" class="card"><div class="state-box !py-8">没有 Playlist 数据</div></div>
    </div>

    <div v-else class="card">
      <div class="state-box !py-16">
        <div class="ico">
          <svg width="26" height="26" viewBox="0 0 256 256" fill="currentColor"><path d="M226.53,56.87l-96-32a8,8,0,0,0-5.06,0l-96,32A8,8,0,0,0,24,64.5V192a8,8,0,0,0,8,8h192a8,8,0,0,0,8-8V64.5A8,8,0,0,0,226.53,56.87ZM128,184a32,32,0,0,1-32-32V105.63l64-21.34V152A32,32,0,0,1,128,184Z"></path></svg>
        </div>
        <b>选择一个 Playlist 类别开始</b>
        <span>点击右上角按钮加载待创建的、当前用户的或所有用户的歌单</span>
      </div>
    </div>
  </div>
</template>
