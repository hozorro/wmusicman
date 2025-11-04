<script setup lang="ts">
import { ref } from 'vue'
import { useRequest } from 'alova/client'
import { getOutPlaylist } from '@/apis/methods/manage'

const playlistLink = ref('')
const { data, send } = useRequest(getOutPlaylist(playlistLink.value))

function handleGetPlaylist() {
  if(playlistLink.value){
    send()
  }
}
</script>

<template>
  <div class=" flex flex-col h-full p-2">
    <div class=" flex-none flex w-full">
      <div class=" flex-1">
        <input type="text" v-model="playlistLink" class=" w-full border border-gray-200 outline-0" placeholder="netease playlist link..." />
      </div>
      <div class=" flex-none ml-2">
        <button class=" w-28" @click="handleGetPlaylist">Get</button>
      </div>
    </div>
    <div class=" flex-1 w-full overflow-y-auto">
      <div class=" w-full font-bold">{{ data.data.name }}</div>
      <div class=" w-full h-full overflow-y-auto">
        <div v-for="(track, index) in data.data.tracks" :key="index">
          <div class=" w-full h-10 p-2 border-b border-gray-200">
            {{ `${index+1} ${track.artist} - ${track.name}` }}
            <span class=" ml-2 text-gray-400">({{ track.album }}){{ track.duration }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>