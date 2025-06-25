<script setup lang="ts">
import { ref } from 'vue'
import { getTmpPlaylistJsons, createPlaylistFromJson, deleteJson } from '@/apis/methods/manage'

const jsonLists = ref<{title: string, files: string[], show?: boolean}[]>()

function getJsonList(){
  getTmpPlaylistJsons().then((res) => {
    if(res.code === 200){
      jsonLists.value = res.data
      jsonLists.value.forEach(jf => {
        jf.show = false
      })
    }
  })
}
function createPlaylist(title: string){
  createPlaylistFromJson(title).then((res) => {
    if(res.code === 200){
      if(res.data.playlist != ''){
        alert(`Playlist <${res.data.playlist}> of ${res.data.count} songs created!`)
      }
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
  </div>
  <div class=" mt-2 w-full">
    <div v-for="(jf,i) in jsonLists" :key="i">
      <div class=" flex justify-between">
        <div class=" flex-none w-4 pt-4 mr-2 cursor-pointer" @click="jf.show = !jf.show">{{ jf.show ? '▲' : '▼' }}</div>
        <div class=" flex-1 font-bold mt-2 mb-1 p-2">{{ jf.title }}</div>
        <div class=" flex-none p-2">
          <button type="button" class=" p-2" @click="createPlaylist(jf.title)">创建</button>
          <button type="button" class=" ml-2 p-2" @click="delJson(jf.title)">删除</button>
        </div>
      </div>
      <div class=" mt-2 p-2 w-full bg-gray-200 rounded-md" :style="{display:jf.show?'block':'none'}">
          <ul>
            <li v-for="(f,j) in jf.files" :key="j">{{ f }}</li>
          </ul>
        </div>
    </div>
  </div>
</template>