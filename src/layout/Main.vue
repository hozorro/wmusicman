<script setup lang="ts">
import { ref, computed, inject, onMounted, onUnmounted, watch } from 'vue';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { scanState, type ScanState, artworkState, type ArtworkState } from '@/composables/key';
import { getScanInfo } from '@/apis/methods/manage';
import { TokenStorage } from '@/utils/auth';

const menuItems = [
  { label: 'Initialize', to: '/initial'},
  { label: 'Dashboard', to: '/', exact: true },
  { label: 'Upload', to: '/upload' },
  { label: 'Transfer', to: '/transfer' },
  { label: 'Edit Info', to: '/edit' },
  { label: 'Scanner', to: '/scan' },
  { label: 'Artwork', to: '/artwork' },
  { label: 'Playlist', to: '/playlist' },
  { label: 'Backup', to: '/backup' },
  { label: 'Log', to: '/log' },
  { label: 'Settings', to: '/settings' },
  { label: 'Tool', to: '/tool' },
  { label: 'Help', to: '/help' },
]

const baseURL = import.meta.env.VITE_BASE_URL;
const { scanInfo, updateScanInfo } = inject<ScanState>(scanState) as ScanState;
const { artworkInfo, updateArtworkInfo } = inject<ArtworkState>(artworkState) as ArtworkState;

const flashMsg = computed(() => {
  if (scanInfo.value.is_scanning && scanInfo.value.scan_progress) {
    return `Scanner is running: ${scanInfo.value.scan_progress.processed} / ${scanInfo.value.scan_progress.total} processed.`
  } else {
    return ''
  }
})
const displayFlash = computed(() => scanInfo.value.is_scanning ? 'block' : 'none')

let evtSrc: EventSourcePolyfill | null = null
let artworkEvtSrc: EventSourcePolyfill | null = null

onMounted(async () => { 
  const info = await getScanInfo()
  updateScanInfo(info)
})

onUnmounted(() => { 
  if(evtSrc) {
    evtSrc.close()
    evtSrc = null
  }
  if(artworkEvtSrc) {
    artworkEvtSrc.close()
    artworkEvtSrc = null
  }
})

watch(() => scanInfo.value.is_scanning, (val) => { 
  if(val) {
    if(evtSrc == null) {
      const token = TokenStorage.getAccessToken()
      evtSrc = new EventSourcePolyfill(`${baseURL}admin/scan/progress`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
    }
    evtSrc.onmessage = (e) => { 
      const data = JSON.parse(e.data) as ScanInfo
      updateScanInfo(data)
      if (data.is_scanning == false) { 
        // when scanner finished, close the event source connection mannually
        // if close it by watching the is_scanning, there will be a delay and may miss the last update of scan progress
        // and error may occur when close the connection while it's still sending data
        console.log('Scanner finished.')
        evtSrc?.close()
        evtSrc = null
      }
    }
    evtSrc.onerror = () => { 
      if(evtSrc) {
        console.error('Error in scan progress event source, closing it.')
        evtSrc.close()
        evtSrc = null
      }
    }
  } else {
    if(evtSrc) {
      evtSrc.close()
      evtSrc = null
    }
  }
})

// Watch artwork generation progress
watch(() => artworkInfo.value.is_generating, (val) => { 
  if(val) {
    if(artworkEvtSrc == null) {
      const token = TokenStorage.getAccessToken()
      artworkEvtSrc = new EventSourcePolyfill(`${baseURL}admin/artwork/progress`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
    }
    artworkEvtSrc.onmessage = (e) => { 
      const data = JSON.parse(e.data) as ArtworkInfo
      updateArtworkInfo(data)
      if (data.is_generating == false) { 
        // when artwork generation finished, close the event source connection manually
        console.log('Artwork generation finished.')
        artworkEvtSrc?.close()
        artworkEvtSrc = null
      }
    }
    artworkEvtSrc.onerror = () => { 
      if(artworkEvtSrc) {
        console.error('Error in artwork progress event source, closing it.')
        artworkEvtSrc.close()
        artworkEvtSrc = null
      }
    }
  } else {
    if(artworkEvtSrc) {
      artworkEvtSrc.close()
      artworkEvtSrc = null
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