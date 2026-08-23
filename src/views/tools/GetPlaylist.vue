<script setup lang="ts">
import { ref } from 'vue'
import { useRequest } from 'alova/client'
import { getOutPlaylist } from '@/apis/methods/manage'

const playlistLink = ref('')
const { data, send } = useRequest(getOutPlaylist(playlistLink.value), { immediate: false })

function handleGetPlaylist() {
  if(playlistLink.value){
    send()
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="card">
      <div class="card-header">
        <h2>获取外部播放列表</h2>
        <span class="sp"></span>
        <span class="text-[12.5px] text-ink-3">需要外部 api</span>
      </div>
      <div class="card-pad">
        <div class="flex gap-2.5">
          <input type="text" v-model="playlistLink" class="input flex-1" placeholder="netease playlist link..." />
          <button type="button" class="btn btn-primary" @click="handleGetPlaylist">Get</button>
        </div>
      </div>
    </div>

    <div v-if="data" class="card">
      <div class="card-header">
        <h2>{{ data.name }}</h2>
        <span class="sp"></span>
        <span class="tag tag-info num">{{ data.tracks.length }} tracks</span>
      </div>
      <div class="tbl-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th class="w-14">#</th>
              <th>曲目</th>
              <th class="w-1/3">专辑</th>
              <th class="w-24">时长</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(track, index) in data.tracks" :key="index">
              <td class="num text-ink-3">{{ index + 1 }}</td>
              <td>{{ track.name }} <span class="text-ink-3">- {{ track.artist }}</span></td>
              <td class="text-ink-3">{{ track.album }}</td>
              <td class="num text-ink-3">{{ track.duration }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
