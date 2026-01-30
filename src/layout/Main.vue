<script setup lang="ts">
import { ref, computed, inject, onMounted, onUnmounted, watch } from 'vue';
import { scanState, type ScanState } from '@/composables/key';
import { getScanInfo } from '@/apis/methods/manage';

const baseWsURL = import.meta.env.VITE_BASE_WS_URL;
const { scanInfo, updateScanInfo } = inject<ScanState>(scanState) as ScanState;
const flashMsg = computed(() => {
  if (scanInfo.value.is_scanning) {
    return `Scanner is running! ${scanInfo.value.scan_progress.proceeded} / ${scanInfo.value.scan_progress.total} processed.`
  } else {
    return ''
  }
})
const displayFlash = computed(() => scanInfo.value.is_scanning ? 'block' : 'none')

let ws: WebSocket | null = null;

onMounted(async () => { 
  const info = await getScanInfo()
  updateScanInfo(info)
})

onUnmounted(() => { 
  if(ws) {
    ws.close()
    ws = null
  }
})

watch(() => scanInfo.value.is_scanning, (val) => { 
  if(val) {
    if(ws == null) {
      ws = new WebSocket(`${baseWsURL}scan-progress?token=${localStorage.getItem('token')}`)
      ws.onmessage = (e) => { 
        const data = JSON.parse(e.data)
        if(data.type == 'scan_progress') {
          updateScanInfo(data.data as ScanInfo)
        }
      }
    }
  } else {
    if(ws) {
      ws.close()
      ws = null
    }
  }
})

const showNav = ref(true)
</script>

<template>
  <div class=" absolute top-10 w-4 h-10 bg-amber-500 rounded-r-md shadow z-10 opacity-20 hover:opacity-100 hover:cursor-pointer" :class="showNav ? 'left-32' : 'left-0'" @click="showNav=!showNav"></div>
  <nav class=" flex-none w-32 bg-cyan-600 h-svh" :class="{'hidden': !showNav }">
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
        <router-link to="/backup" class=" block p-2" activeClass="active">Backup</router-link>
      </li>
      <li>
        <router-link to="/log" class=" block p-2" activeClass="active">Log</router-link>
      </li>
      <li>
        <router-link to="/settings" class=" block p-2" activeClass="active">Settings</router-link>
      </li>
      <li>
        <router-link to="/tool" class=" block p-2" activeClass="active">Tool</router-link>
      </li>
      <li>
        <router-link to="/help" class=" block p-2" activeClass="active">Help</router-link>
      </li>
    </ul>
  </nav>
  <div class=" flex-1 h-svh p-2">
    <div class=" relative bg-sky-50 rounded-md shadow-md h-full p-2">
      <div class=" absolute -top-2 left-0 hidden w-full h-4 pl-2 text-xs bg-red-100 rounded-md shadow-md" :style="{display:displayFlash}">{{ flashMsg }}</div>
      <router-view />
    </div>
  </div>
</template>

<style scoped>
.active {
  background-color: #007595;
}
</style>