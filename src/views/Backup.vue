<script setup lang="ts">
import { ref } from 'vue'
import { backupAllPlaylists, backupAllHits, restoreAllPlaylists, restoreAllHits } from '@/apis/methods/manage'

const backupItems = ref<string[]>(['playlist', 'hits'])
const restoreItems = ref<string[]>(['playlist', 'hits'])
const optInfo = ref('')

async function handleBackup() {
  optInfo.value = 'Begin to backup...'
  if(backupItems.value.includes('playlist')) {
    const answer = confirm('将备份包括所有歌单、歌曲播放记录，如要选择备份部分歌单，请移步Playlist页面。请确认是否继续？')
    if(!answer) return
    const resPlaylist = await backupAllPlaylists()
    optInfo.value += `\n${resPlaylist.data} playlists backed`
  }
  if(backupItems.value.includes('hits')){
    const resHits = await backupAllHits()
    optInfo.value += `\n${resHits.data} hits backed`
  }
}

async function handleRestore() { 
  optInfo.value = 'Begin to restore...'
  if(restoreItems.value.includes('playlist')) {
    const answer = confirm('将恢复所有歌单，如要恢复部分歌单，请移步Playlist页面。请确认是否继续？')
    if(!answer) return
    const resPlaylist = await restoreAllPlaylists()
    Object.entries(resPlaylist.data).forEach(([pl, count]) => {
      optInfo.value += `\n${pl} restored ${count} tracks`
    })
  }
  if(restoreItems.value.includes('hits')) {
    const resHits = await restoreAllHits()
    optInfo.value += `\n${resHits.data} hits restored`
  }
}
</script>

<template>
  <div class=" my-2 flex align-middle">
    <div class=" border p-1 border-cyan-500 border-dotted rounded-md mr-2">
      <input type="checkbox" id="playlist" value="playlist" class=" mr-1" v-model="backupItems"><label for="playlist">歌单</label>
      <input type="checkbox" id="hits" value="hits" class=" ml-2 mr-1" v-model="backupItems"><label for="hits">播放记录</label>
      <button type="button" class=" mx-2 p-2 w-28" @click="handleBackup">备份播放数据</button>
    </div>
    <div class=" border p-1 border-cyan-500 border-dotted rounded-md mr-2">
      <input type="checkbox" id="playlist" value="playlist" class=" mr-1" v-model="restoreItems"><label for="playlist">歌单</label>
      <input type="checkbox" id="hits" value="hits" class=" ml-2 mr-1" v-model="restoreItems"><label for="hits">播放记录</label>
      <button type="button" class=" mx-2 p-2 w-28" @click="handleRestore">恢复播放数据</button>
    </div>
  </div>
  <div class=" my-2 text-red-500 text-sm font-black">
    备份或恢复歌单时，会一次性备份或恢复所有歌单，如要备份或恢复部分歌单，可到Playlist页面进行操作。
  </div>
  <hr class=" my-2 text-gray-300" />
  <div class=" my-1 text-xl font-bold">Operation Info</div>
  <div class=" p-2 w-full h-20 bg-gray-800 text-green-300 rounded-md whitespace-pre-wrap">
    {{ optInfo }}
  </div>
</template>