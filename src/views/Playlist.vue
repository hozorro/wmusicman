<script setup lang="ts">
import { ref } from 'vue'
import { getTmpPlaylistJsons, getCurrentPlaylists, getAllPlaylists, backupPlaylist, createPlaylistFromJson, deleteJson } from '@/apis/methods/manage'

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
  <div class=" my-2">
    <button type="button" class=" mr-2 p-2 w-36" @click="getJsonList">待创建的Playlist</button>
    <button type="button" class=" mr-2 p-2 w-40" @click="getCurUserPlaylists">当前用户的Playlist</button>
    <button type="button" class=" p-2 w-40" @click="getAllUserPlaylists">所有用户的Playlist</button>
  </div>
  <div class=" mt-2 w-full h-[calc(100svh_-_6rem)] overflow-y-auto">
    <div v-if="listCate == 'json'">
      <div v-for="(jf,i) in jsonLists" :key="i">
        <div class=" flex justify-between">
          <div class=" flex-none w-4 pt-4 cursor-pointer" @click="jf.show = !jf.show">{{ jf.show ? '▲' : '▼' }}</div>
          <div class=" flex-1 font-bold mt-2 mb-1 p-2">
            <span class=" px-1 border-2 border-cyan-500 text-cyan-500 rounded-md">{{ jf.source }}</span>
            <span class=" ml-1">{{ jf.title }} ({{ jf.tracks.length }})</span>
            <span class=" ml-1">{{ jf.username }})</span>
          </div>
          <div class=" flex-none p-2">
            <button type="button" class=" px-2" @click="createPlaylist(jf.filename)">创建</button>
            <button type="button" class=" ml-2 px-2" @click="delJson(jf.filename)">删除</button>
          </div>
        </div>
        <div class=" p-2 w-full bg-gray-200 rounded-md" :style="{display:jf.show?'block':'none'}">
          <ul>
            <li v-for="(f,j) in jf.tracks" :key="j" class=" truncate">{{ f }}</li>
          </ul>
        </div>
      </div>
    </div>
    <div v-else-if="listCate == 'playlist'"> 
      <div v-for="(pl,i) in userPlaylists" :key="i">
        <div class=" flex justify-between">
          <div class=" flex-none w-4 pt-4 cursor-pointer" @click="pl.show = !pl.show">{{ pl.show ? '▲' : '▼' }}</div>
          <div class=" flex-1 font-bold mt-2 mb-1 p-2">
            <span class=" px-1 border-2 border-cyan-500 text-cyan-500 rounded-md">{{ pl.title }} ({{ pl.tracks.length }})</span>
            <span class=" ml-1">{{ pl.username }})</span>
          </div>
          <div class=" flex-none p-2"> 
            <button type="button" class=" px-2" @click="bkPlaylist(pl.id)">备份</button>
          </div>
        </div>
        <div class=" p-2 w-full bg-gray-200 rounded-md" :style="{display:pl.show?'block':'none'}">
          <ul>
            <li v-for="(t,j) in pl.tracks" :key="j" class=" truncate">{{ t.title }} - {{ t.artists.join(',') }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>