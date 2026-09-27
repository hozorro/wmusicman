<script setup lang="ts">
import { ref, computed, inject, provide, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { scanState, type ScanState, artworkState, type ArtworkState } from '@/composables/key';
import { busyState, type BusyReason } from '@/composables/busy';
import { getScanInfo, getCurrentUser } from '@/apis/methods/manage';
import { TokenStorage } from '@/utils/auth';
import { useAuthStore } from '@/store/auth';
import StatusBar from '@/components/StatusBar.vue';

// Sidebar menu grouped per design prototype: Overview / Music / Library / System
interface MenuItem { label: string; to: string; icon: string; exact?: boolean }
const menuGroups: { label: string; items: MenuItem[] }[] = [
  { label: 'Overview', items: [
    { label: 'Dashboard', to: '/', exact: true, icon: 'M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24ZM80,136a16,16,0,1,1,16-16A16,16,0,0,1,80,136Zm48,48a16,16,0,1,1,16-16A16,16,0,0,1,128,184Zm0-96a16,16,0,1,1,16-16A16,16,0,0,1,128,88Zm48,48a16,16,0,1,1,16-16A16,16,0,0,1,176,136Z' },
  ]},
  { label: 'Music', items: [
    { label: 'Upload', to: '/upload', icon: 'M224,152a8,8,0,0,1-8,8H178.24l-14.13,25.71A8,8,0,0,1,157.5,192H126.7l-14.13,25.71A8,8,0,0,1,106.5,224H48a8,8,0,0,1,0-16H101.3l14.13-25.71A8,8,0,0,1,122.5,176h30.8l14.13-25.71A8,8,0,0,1,173.5,144H216A8,8,0,0,1,224,152ZM112,136V112H96a8,8,0,0,1-5.66-13.66l32-32a8,8,0,0,1,11.32,0l32,32A8,8,0,0,1,160,112h-16v24a8,8,0,0,1-16,0h-16Z' },
    { label: 'Transfer', to: '/transfer', icon: 'M224,128a8,8,0,0,1-8,8H152v64a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h96V56a8,8,0,0,1,16,0v64h64A8,8,0,0,1,224,128Z' },
    { label: 'Edit Info', to: '/edit', icon: 'M224,128a8,8,0,0,1-8,8H131.31l26.35,26.34a8,8,0,0,1-11.32,11.32L112,147.31V216a8,8,0,0,1-16,0V147.31L69.66,173.66a8,8,0,0,1-11.32-11.32L84.69,136H40a8,8,0,0,1,0-16H84.69L58.34,93.66a8,8,0,0,1,11.32-11.32L96,108.69V40a8,8,0,0,1,16,0v68.69l26.34-26.35a8,8,0,0,1,11.32,11.32L131.31,120H216A8,8,0,0,1,224,128Z' },
    { label: 'Playlist', to: '/playlist', icon: 'M216,128a8,8,0,0,1-8,8H123.3l18.49,22.63a8,8,0,1,1-12.3,10.06l-32-39.16a8,8,0,0,1,0-9.94l32-39.16a8,8,0,0,1,12.3,10.06L123.3,120H208A8,8,0,0,1,216,128ZM40,56H168a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16Zm0,32H168a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16Zm0,32h88a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16Z' },
  ]},
  { label: 'Library', items: [
    { label: 'Scanner', to: '/scan', icon: 'M229.66,218.34,184,172.7a92.1,92.1,0,1,0-11.31,11.31l45.63,45.64a8,8,0,0,0,11.32-11.32ZM40,116a76,76,0,1,1,76,76A76.08,76.08,0,0,1,40,116Z' },
    { label: 'Artwork', to: '/artwork', icon: 'M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,160H40V56H216V200ZM170.34,99.66a8,8,0,0,1,0,11.32l-32,32a8,8,0,0,1-11.31,0l-16-16a8,8,0,0,1,11.32-11.32L132,124.69l26.34-26.35A8,8,0,0,1,170.34,99.66ZM180,76a12,12,0,1,1-12-12A12,12,0,0,1,180,76Z' },
    { label: 'Backup', to: '/backup', icon: 'M128,24A104,104,0,0,0,47.1,197.7a8,8,0,0,0,2.6,5.4,8,8,0,0,0,5.9,2.5H200.4a8,8,0,0,0,5.9-2.5,8,8,0,0,0,2.6-5.4A104,104,0,0,0,128,24ZM88,152a8,8,0,0,1,0-16h80a8,8,0,0,1,0,16Zm0-32a8,8,0,0,1,0-16h80a8,8,0,0,1,0,16Z' },
  ]},
  { label: 'System', items: [
    { label: 'Log', to: '/log', icon: 'M216,48H176V40a16,16,0,0,0-16-16H96A16,16,0,0,0,80,40v8H40A8,8,0,0,0,32,56V200a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V56A8,8,0,0,0,216,48ZM96,40h64v8H96Zm88,144H72a8,8,0,0,1,0-16H184a8,8,0,0,1,0,16Zm0-32H72a8,8,0,0,1,0-16H184a8,8,0,0,1,0,16Zm0-32H72a8,8,0,0,1,0-16H184a8,8,0,0,1,0,16Z' },
    { label: 'Settings', to: '/settings', icon: 'M128,88a40,40,0,1,0,40,40A40,40,0,0,0,128,88Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,152Zm93.89-34.41a8,8,0,0,0-5-6.13l-27.61-9.2a71.3,71.3,0,0,0-5.53-15.3l7.55-26.76a8,8,0,0,0-2.85-8.69,104.1,104.1,0,0,0-36.6-21.14,8,8,0,0,0-9.12,3.19L137.15,51.1a72.38,72.38,0,0,0-18.3,0L104.26,21.86a8,8,0,0,0-9.12-3.19A104.1,104.1,0,0,0,58.54,39.81a8,8,0,0,0-2.85,8.69l7.55,26.76a71.3,71.3,0,0,0-5.53,15.3l-27.61,9.2a8,8,0,0,0-5,6.13,105.22,105.22,0,0,0,0,36.82,8,8,0,0,0,5,6.13l27.61,9.2a71.3,71.3,0,0,0,5.53,15.3l-7.55,26.76a8,8,0,0,0,2.85,8.69,104.1,104.1,0,0,0,36.6,21.14,8,8,0,0,0,9.12-3.19l9.59-29.24a72.38,72.38,0,0,0,18.3,0l9.59,29.24a8,8,0,0,0,9.12,3.19,104.1,104.1,0,0,0,36.6-21.14,8,8,0,0,0,2.85-8.69l-7.55-26.76a71.3,71.3,0,0,0,5.53-15.3l27.61-9.2a8,8,0,0,0,5-6.13A105.22,105.22,0,0,0,221.89,117.59Z' },
    { label: 'Tool', to: '/tool', icon: 'M226.77,86.7a55.8,55.8,0,0,0-95.14-29.93,8,8,0,0,0-.56,10.46l26.1,37a4,4,0,0,1-.82,5.78l-33,22.75a4,4,0,0,1-5.66-.93L91.6,94.86A8,8,0,0,0,81.36,91.7,56,56,0,0,0,63.3,171.18l-36,44.14A16,16,0,0,0,29.44,238l.59,0a16,16,0,0,0,12.31-6.15l35.47-44.29A56,56,0,0,0,157.92,170a8,8,0,0,0-3.17-10.24l-34-21.46a4,4,0,0,1-1.73-5.56l22.75-33a4,4,0,0,1,5.78-.82l37,26.1a8,8,0,0,0,10.46-.56A55.71,55.71,0,0,0,226.77,86.7Z' },
    { label: 'Initialize', to: '/initial', icon: 'M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm37.66,82.34-28.71,28.71a8,8,0,0,1-11.31,0l-12.69-12.69a8,8,0,0,1,11.31-11.32l7,7,23-23a8,8,0,0,1,11.32,11.32Z' },
    { label: 'Help', to: '/help', icon: 'M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-28a12,12,0,1,1,12,12A12,12,0,0,1,120,188Zm8-108c-18.69,0-32,13.75-32,32v4a8,8,0,0,0,16,0v-4c0-8.82,7.18-16,16-16s16,7.18,16,16-6.29,12.75-12.54,17.17C116.33,133.47,112,141.22,112,152a8,8,0,0,0,16,0c0-6.43,3.39-11.37,9.46-15.46C145.48,131.88,152,124,152,112A24,24,0,0,0,128,80Z' },
  ]},
]

// Breadcrumb mapping: longest prefix wins (ordered specific → general)
const crumbMap: Array<{ prefix: string, group: string, title: string }> = [
  { prefix: '/initial', group: 'System', title: 'Initialize' },
  { prefix: '/upload', group: 'Music', title: 'Upload' },
  { prefix: '/transfer', group: 'Music', title: 'Transfer' },
  { prefix: '/edit', group: 'Music', title: 'Edit Info' },
  { prefix: '/playlist', group: 'Music', title: 'Playlist' },
  { prefix: '/scan', group: 'Library', title: 'Scanner' },
  { prefix: '/artwork', group: 'Library', title: 'Artwork' },
  { prefix: '/backup', group: 'Library', title: 'Backup' },
  { prefix: '/log', group: 'System', title: 'Log' },
  { prefix: '/settings', group: 'System', title: 'Settings' },
  { prefix: '/tool', group: 'System', title: 'Tool' },
  { prefix: '/help', group: 'System', title: 'Help' },
  { prefix: '/', group: 'Overview', title: 'Dashboard' },
]

const route = useRoute()
const authStore = useAuthStore()

const crumb = computed(() => {
  const hit = crumbMap.find(m => route.path === m.prefix || route.path.startsWith(m.prefix + '/'))
  return hit ?? { group: 'Overview', title: 'Dashboard' }
})

const username = ref('')

function handleLogout() {
  authStore.logout(false)
}

const baseURL = import.meta.env.VITE_BASE_URL;
const { scanInfo, updateScanInfo } = inject<ScanState>(scanState) as ScanState;
const { artworkInfo, updateArtworkInfo } = inject<ArtworkState>(artworkState) as ArtworkState;

// Global busy state (read-only derived): scan and artwork rebuild are mutually
// exclusive; while either runs, all operation entries across pages are disabled.
const busy = computed(() => scanInfo.value.is_scanning || artworkInfo.value.is_generating)
const busyReason = computed<BusyReason>(() => {
  if (scanInfo.value.is_scanning) return 'scan'
  if (artworkInfo.value.is_generating) return 'artwork'
  return ''
})
provide(busyState, { busy, busyReason })

let evtSrc: EventSourcePolyfill | null = null
let artworkEvtSrc: EventSourcePolyfill | null = null

onMounted(async () => { 
  const info = await getScanInfo()
  updateScanInfo(info)
  if (authStore.userInfo?.username) {
    username.value = authStore.userInfo.username
  } else {
    const curUser = await getCurrentUser().send()
    authStore.userInfo = curUser
    username.value = curUser.username
  }
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
      // When generation finishes, backend may send artwork_progress as null.
      // In that case, only update is_generating and preserve the last valid progress data.
      if (data.artwork_progress == null) {
        artworkInfo.value.is_generating = data.is_generating
      } else {
        updateArtworkInfo(data)
      }
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
  <div 
    class=" relative w-full h-full grid transition-[grid-template-columns] duration-200 ease-in-out" 
    :class="{'grid-cols-[var(--side)_1fr]': showNav, 'grid-cols-[var(--side-collapsed)_1fr]': !showNav}"
  >
    <!-- collapse handle (kept from previous layout) -->
    <button
      class=" absolute top-10 left-[calc(var(--side)-8px)] z-20 grid place-items-center w-4 h-10 rounded-r-md bg-accent-soft hover:bg-accent-soft-strong text-accent transition-[left] duration-200 ease-in-out"
      :class="{ 'left-[calc(var(--side-collapsed)-8px)]': !showNav }"
      :title="showNav ? 'Collapse menu' : 'Expand menu'"
      @click="showNav = !showNav"
    >
      <svg width="12" height="12" viewBox="0 0 256 256" fill="currentColor" :style="{ transform: showNav ? '' : 'rotate(180deg)' }">
        <path d="M165.66,133.66,101.66,197.66a8,8,0,0,1-11.32-11.32L148.69,128,90.34,69.66a8,8,0,0,1,11.32-11.32l64,64A8,8,0,0,1,165.66,133.66Z"/>
      </svg>
    </button>

    <!-- sidebar -->
    <nav 
      class=" flex flex-col overflow-y-auto overflow-x-hidden bg-white border-r border-r-line
            [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-line-strong [&::-webkit-scrollbar-thumb]:rounded-xs"
    >
      <div class="flex-none flex items-center gap-2.5 pt-4.5 px-4 pb-3.5 border-b border-b-line">
        <div class=" flex-none grid place-items-center text-white w-8 h-8 bg-gradient-to-tl from-accent to-accent-light rounded-md">
          <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
            <path d="M216.76,38.52a8,8,0,0,0-6.86-1.45l-128,32A8,8,0,0,0,72,76.67V155.1A36,36,0,1,0,88,184V84.1l112-28v71A36,36,0,1,0,216,152V44A8,8,0,0,0,216.76,38.52Z"/>
          </svg>
        </div>
        <div v-show="showNav" class=" leading-[1.2] whitespace-nowrap">
          <b class="text-[14.5px] text-ink-1 font-bold block">WMusic Manager</b>
          <span class="text-[11px] text-ink-3">Music Library</span>
        </div>
      </div>
      <div class=" flex-1 p-2">
        <template v-for="grp in menuGroups" :key="grp.label">
          <div v-show="showNav" class=" text-[11px] text-ink-3 pt-3.5 px-2.5 pb-1.5 -tracking-tighter uppercase font-semibold whitespace-nowrap">{{ grp.label }}</div>
          <router-link
            v-for="item in grp.items"
            :key="item.to"
            :to="item.to"
            custom
            v-slot="{ href, navigate, isActive, isExactActive }"
          >
            <a
              :href="href"
              class=" flex items-center gap-2.5 mb-[1px] px-2.5 py-2 rounded-md text-[13.5px] text-ink-2 transition-all duration-150 whitespace-nowrap hover:bg-panel hover:text-ink-1"
              :class="{ 
                'bg-accent-soft text-accent font-semibold': item.exact ? isExactActive : isActive,
                'justify-center p-2.5': !showNav
              }"
              @click="navigate"
            >
              <svg width="18" height="18" class=" text-ink-3 flex-none" viewBox="0 0 256 256" fill="currentColor"><path :d="item.icon" /></svg>
              <span v-show="showNav" class="label">{{ item.label }}</span>
            </a>
          </router-link>
        </template>
      </div>
      <div class=" flex flex-none items-center gap-2.5 px-4 py-3 border-t border-t-line">
        <div class=" grid flex-none place-items-center w-8 h-8 rounded-full bg-accent-soft text-accent font-semibold text-[13px]">{{ username.charAt(0).toUpperCase() }}</div>
        <div v-show="showNav" class="leading-[1.3] min-w-0 whitespace-nowrap">
          <b class=" block text-[13px] text-ink-1">{{ username }}</b>
          <span class="text-[11px] text-ink-3">Administrator</span>
        </div>
        <button v-show="showNav" class="btn btn-ghost btn-icon btn-sm ml-auto" title="Logout" @click="handleLogout">
          <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
            <path d="M120,216a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V40a8,8,0,0,1,8-8h64a8,8,0,0,1,0,16H56V208h56A8,8,0,0,1,120,216Zm101.66-93.66-32-32a8,8,0,0,0-11.32,11.32L204.69,120H112a8,8,0,0,0,0,16h92.69l-26.35,26.34a8,8,0,0,0,11.32,11.32l32-32A8,8,0,0,0,221.66,122.34Z"/>
          </svg>
        </button>
      </div>
    </nav>

    <!-- main column -->
    <div class=" relative flex flex-col min-w-0 overflow-hidden">
      <header class=" flex flex-none items-center gap-3.5 py-0 px-6 h-14 border-b border-b-line bg-white">
        <div class=" flex items-center gap-1.5 text-[13px] text-ink-3">
          <span>{{ crumb.group }}</span>
          <span>/</span>
          <b class="text-ink-1 font-semibold">{{ crumb.title }}</b>
        </div>
      </header>
      <div class=" flex-1 overflow-y-auto py-5 px-6
        [&::-webkit-scrollbar]:w-1.5 
        [&::-webkit-scrollbar-thumb]:bg-line-strong 
        [&::-webkit-scrollbar-thumb]:rounded-xs"
      >
        <router-view />
      </div>
      <StatusBar />
    </div>
  </div>
</template>
