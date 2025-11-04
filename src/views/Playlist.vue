<script setup lang="ts">
import { ref } from 'vue'
import { getTmpPlaylistJsons, getCurrentPlaylists, backupPlaylist, createPlaylistFromJson, deleteJson } from '@/apis/methods/manage'

const jsonLists = ref<{title: string, filename: string, source: string, items: string[], show?: boolean}[]>()
const mode = ref<'create' | 'backup'>('create')

function getJsonList(){
  getTmpPlaylistJsons().then((res) => {
    if(res.code === 200){
      jsonLists.value = res.data
      jsonLists.value.forEach(jf => {
        jf.show = false
      })
      mode.value = 'create'
    }
  })
}
function getCurPlaylists() {
  getCurrentPlaylists().then((res) => {
    if(res.code === 200){
      jsonLists.value = res.data
      jsonLists.value.forEach(jf => {
        jf.show = false
      })
      mode.value = 'backup'
    }
  })
}
function bkPlaylist(id: string){
  backupPlaylist(id).then((res) => {
    if(res.code == 200){
      alert(`Playlist <${res.data}> backuped!`)
    } else {
      alert(`Failed to backup playlist: ${res.data}`)
    }
  })
}
function createPlaylist(title: string, filename: string){
  createPlaylistFromJson(title, filename).then((res) => {
    if(res.code === 200){
      if(res.data.playlist != ''){
        alert(`Playlist <${res.data.playlist}> of ${res.data.count}/${res.data.original_count} songs created!`)
      }
    } else {
      alert(`Failed to create playlist: ${res.data}`)
    }
  })
}
function delJson(title: string){
  deleteJson(title).then((data) => {
    if(data){
      alert(`${data} deleted!`)
      getJsonList()
    }
  })
}

</script>

<template>
  <div class=" my-2">
    <button type="button" class=" mr-2 p-2 w-36" @click="getJsonList">待创建的Playlist</button>
    <button type="button" class=" mr-2 p-2 w-36" @click="getCurPlaylists">备份现有Playlist</button>
  </div>
  <div class=" mt-2 w-full h-[calc(100svh_-_6rem)] overflow-y-auto">
    <div v-for="(jf,i) in jsonLists" :key="i">
      <div class=" flex justify-between">
        <div class=" flex-none w-4 pt-4 cursor-pointer" @click="jf.show = !jf.show">{{ jf.show ? '▲' : '▼' }}</div>
        <div class=" flex-1 font-bold mt-2 mb-1 p-2">
          <span class=" px-1 border-2 border-cyan-500 text-cyan-500 rounded-md">{{ jf.source }}</span>
          <span class=" ml-1">{{ jf.title }} ({{ jf.items.length }})</span>
        </div>
        <div class=" flex-none p-2">
          <button v-if="mode === 'create'" type="button" class=" px-2" @click="createPlaylist(jf.title, jf.filename)">创建</button>
          <button v-if="mode === 'create'" type="button" class=" ml-2 px-2" @click="delJson(jf.filename)">删除</button>
          <button v-if="mode === 'backup'" type="button" class=" px-2" @click="bkPlaylist(jf.filename)">备份</button>
        </div>
      </div>
      <div class=" p-2 w-full bg-gray-200 rounded-md" :style="{display:jf.show?'block':'none'}">
          <ul>
            <li v-for="(f,j) in jf.items" :key="j" class=" truncate">{{ f }}</li>
          </ul>
        </div>
    </div>
  </div>
</template>