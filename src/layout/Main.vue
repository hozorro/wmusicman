<script setup lang="ts">
import { ref, computed, inject, onMounted, onUnmounted, watch } from 'vue';
import { scanState, type ScanState } from '@/composables/key';
import { getScanInfo } from '@/apis/methods/manage';

const menuItems = [
  { label: 'Home', to: '/', exact: true },
  { label: 'Upload', to: '/upload' },
  { label: 'Transfer', to: '/transfer' },
  { label: 'Edit Info', to: '/edit' },
  { label: 'Scanner', to: '/scan' },
  { label: 'Playlist', to: '/playlist' },
  { label: 'Backup', to: '/backup' },
  { label: 'Log', to: '/log' },
  { label: 'Settings', to: '/settings' },
  { label: 'Tool', to: '/tool' },
  { label: 'Help', to: '/help' },
]

const baseWsURL = import.meta.env.VITE_BASE_WS_URL;
const { scanInfo, updateScanInfo } = inject<ScanState>(scanState) as ScanState;
const flashMsg = computed(() => {
  if (scanInfo.value.is_scanning && scanInfo.value.scan_progress) {
    return `Scanner is running! ${scanInfo.value.scan_progress.processed} / ${scanInfo.value.scan_progress.total} processed.`
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
    }
    ws.onmessage = (e) => { 
      const data = JSON.parse(e.data)
      updateScanInfo(data.data as ScanInfo)
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
      <li v-for="item in menuItems" :key="item.to">
        <router-link 
          :to="item.to" 
          class=" block p-2" 
          activeClass="active" 
          :exactActiveClass="item.exact ? 'active' : ''">{{ item.label }}</router-link>
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