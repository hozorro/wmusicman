<script setup lang="ts">
import { computed, inject } from 'vue';
import { scanState } from '@/composables/key';
import type { ScanState } from '@/composables/key';

const {scanned} = inject<ScanState>(scanState) as ScanState;
const flashMsg = computed(() => 'Scanner is running, ' + scanned.value + ' files scanned.')
const displayFlash = computed(() => {
  if(scanned.value != -1){
    return 'block'
  }else{
    return 'none'
  }
})
</script>

<template>
  <div class=" flex w-full">
    <nav class=" flex-none w-32 bg-cyan-600 h-svh">
      <ul class=" text-white">
        <li>
          <router-link to="/" class=" block p-2" activeClass="active">Home</router-link>
        </li>
        <li>
          <router-link to="/upload" class=" block p-2" activeClass="active">Upload</router-link>
        </li>
        <li>
          <router-link to="/transfer" class=" block p-2" activeClass="active">Transfer</router-link>
        </li>
        <li>
          <router-link to="/edit" class=" block p-2" activeClass="active">Edit Info</router-link>
        </li>
        <li>
          <router-link to="/scan" class=" block p-2" activeClass="active">Scanner</router-link>
        </li>
        <li>
          <router-link to="/playlist" class=" block p-2" activeClass="active">Playlist</router-link>
        </li>
        <li>
          <router-link to="/log" class=" block p-2" activeClass="active">Log</router-link>
        </li>
      </ul>
    </nav>
    <div class=" flex-1 h-svh p-2">
      <div class=" relative bg-sky-50 rounded-md shadow-md h-full p-2">
        <div class=" absolute -top-2 left-0 hidden w-full h-4 pl-2 text-xs bg-red-100 rounded-md shadow-md" :style="{display:displayFlash}">{{ flashMsg }}</div>
        <router-view />
      </div>
    </div>
  </div>
</template>

<style scoped>
.active {
  background-color: #007595;
}
</style>