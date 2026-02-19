<script setup lang="ts">
import { computed, ref, onUnmounted } from 'vue'
import { useRequest } from 'alova/client';
import { formatTimeDuration } from '@/utils/general'
import { generateFingerprint, matchFingerprint } from '@/apis/methods/manage'

interface PropsSongInfo { // vue limitations, can not use declared interface with extends
  title: string,
  artists: string[],
  album: string,
  genres: string[],
  year: number,
  path: string,
  session: string,
  cover: string | undefined
}

const COVER_API_CONFIG = {
  baseUrl: import.meta.env.VITE_BASE_URL,
  coverApi: 'artwork/staging/'
}

const props = defineProps<PropsSongInfo>()
const props_show = computed(() => {
  const { session, cover, ...props_left } = props
  return props_left
})
const emits= defineEmits(['select', 'confirm', 'close'])

const duration = ref(0)
const fp = ref('')
const acoustInfoList = ref<AcoustInfo[]>([])
const selectedRow = ref<number>(-1)
const mcLoading = ref(false)
const mcLoadFailed = ref(false)
const mcLoaded = ref(false)
const ogLoadFailed = ref(false)
const useNewCoverArt = ref(false)
const mcCache = ref<Record<string, any>>({})
const mcsUrl = computed(() => {
  if (selectedRow.value !== -1) {
    let release_id = acoustInfoList.value?.[selectedRow.value].release_id
    if (mcCache.value?.[release_id]) {
      return mcCache.value[release_id]
    } else {
      const timestamp = new Date().getTime()
      return `${COVER_API_CONFIG.baseUrl}${COVER_API_CONFIG.coverApi}${release_id}?t=${timestamp}`
    }
  }
  return ''
})

const { data: fp_data, loading: fp_loading, send: generateFp_send} = useRequest(() => generateFingerprint(props.path, props.session), {immediate: false})

async function generateFp() {
  await generateFp_send()
  const { duration: dur, fingerprint } = fp_data.value
  duration.value = dur
  fp.value = fingerprint
}

const { data: acoustInfoList_data, loading: acoustInfoList_loading, send: search_send } = useRequest(() => matchFingerprint(duration.value, fp.value), {immediate: false})
async function search() {
  if (!fp.value || !duration.value) return
  await search_send()
  const { matched_list } = acoustInfoList_data.value
  acoustInfoList.value = matched_list
}

const join_names = (arr: {id: string, name: string}[]) => {
  return arr.map(item => item.name).join(', ')
}

let debounceTimer: number | undefined = undefined
async function handleRowSelect(id: number) {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    if (selectedRow.value === id) {
      selectedRow.value = -1
      mcLoading.value = false
    } else {
      selectedRow.value = id
      mcLoading.value = true
      mcLoadFailed.value = false

      if(mcCache.value?.[acoustInfoList.value?.[id].release_id]) {
        mcLoading.value = false
        return
      }
    }
  }, 300)
}
function handleMatchCoverSuccess() {
  mcLoading.value = false
  mcLoadFailed.value = false
  mcLoaded.value = true
  if (selectedRow.value !== -1) {
    const release_id = acoustInfoList.value?.[selectedRow.value].release_id
    mcCache.value[release_id] = mcsUrl.value
  }
}
function handleMatchCoverFailed() {
  mcLoading.value = false
  mcLoadFailed.value = true
  mcLoaded.value = false
  console.log(mcsUrl.value, mcLoadFailed.value, mcLoaded.value)
}
async function handleConfirm() {
  if (selectedRow.value < 0) return
  if(useNewCoverArt.value) {
    const cachedCover = mcCache.value[acoustInfoList.value?.[selectedRow.value].release_id]
    if (!cachedCover) {
      alert('Cover not loaded!')
      return
    }
  }
  emits('confirm', {...acoustInfoList.value?.[selectedRow.value], use_matched_cover: useNewCoverArt.value})
}

onUnmounted(() => {
  clearTimeout(debounceTimer)
  mcCache.value = {}
})
</script>

<template>
  <div class=" flex flex-col h-136 w-240">
    <div class=" flex-none flex border-b border-b-gray-100">
      <div class=" flex-none w-60 p-1">
        <div class=" h-6">Original Info</div>
        <div class=" mt-2 p-2 bg-gray-200 text-sm rounded-md">
          <div class=" grid grid-cols-[3rem_1fr] gap-2" v-for="(v, k, i) in props_show" :key="i">
            <div class=" font-bold">{{ k }}:</div>
            <div class=" break-all">{{ v instanceof Array ? v.join(',') : v }}</div>
          </div>
        </div>
        <div class=" mt-2 p-2 bg-amber-50 text-sm rounded-md">duration: 
          <span v-if="fp_loading">caculating...</span>
          <span v-else>{{ duration ? formatTimeDuration(duration) : '--:--' }}</span>
        </div>
        <div class=" mt-2 p-2 text-center">
          <button type="button" class="  h-6 w-2/5 px-1 mr-2 py-0 disabled:bg-gray-500 disabled:cursor-auto" :disabled="fp_loading" @click="generateFp">Generate</button>
          <button type="button" class="  h-6 w-2/5 px-1 py-0 disabled:bg-gray-500 disabled:cursor-auto" :disabled="acoustInfoList_loading || !fp" @click="search">Search</button>
        </div>
      </div>
      <div class=" flex-1 flex flex-col p-1 h-78">
        <div class=" flex-none h-6">Fingerprint</div>
        <div class=" flex-1 mt-2 p-2 bg-amber-50 text-xs rounded-md break-all overflow-y-scroll">
          <span v-if="fp_loading">generating...</span>
          <span v-else>{{ fp }}</span>
        </div>
      </div>
      <div class=" flex-none flex flex-col gap-2 w-30 p-1">
        <div class=" flex-none">Cover Art</div>
        <div class=" flex-1 text-sm text-gray-500">
          <input type="checkbox" v-model="useNewCoverArt" class="w-4 h-4" />Use matched
        </div>
        <div class=" flex-none p-2 bg-gray-200 rounded-sm text-sm text-gray-500">
          <div class=" flex place-content-center w-full aspect-square">
            <div v-if="ogLoadFailed" class=" h-fit text-center">no original cover</div>
            <img v-else :src="props.cover" class=" w-full h-full object-cover" @error="ogLoadFailed=true">
          </div>
        </div>
        <div class=" flex-none p-2 bg-amber-50 rounded-sm text-sm text-gray-500">
          <div class=" flex place-content-center w-full aspect-square">
            <div v-if="mcsUrl" class=" relative">
              <div v-if="mcLoading" class=" absolute inset-0 flex items-center justify-center">matching cover...</div>
              <div v-else-if="mcLoadFailed" class=" absolute inset-0 flex items-center justify-center text-red-500">match failed</div>
              <img 
                :src="mcsUrl" 
                class=" w-full h-full object-cover"
                :class="{' opacity-0': mcLoading||mcLoadFailed}"
                @load="handleMatchCoverSuccess"
                @error="handleMatchCoverFailed"
              >
            </div>
            <div v-else class=" h-fit text-center">no img</div>
          </div>
        </div>
      </div>
    </div>
    <div class=" flex-1 w-full mt-2 overflow-y-scroll text-sm">
      <table class=" w-full table-auto"> 
        <thead class=" sticky top-0 bg-gray-100 border-b-gray-300">
          <tr>
            <th class=" w-6 p-1">Score</th>
            <th class=" p-1">Title</th>
            <th class=" p-1">Artist</th>
            <th class=" w-8 p-1">Dura</th>
            <th class=" p-1">Album</th>
            <th class=" w-8 p-1">Year</th>
            <th class=" w-8 p-1">Country</th>
            <th class=" p-1">Alb Artist</th>
          </tr>
        </thead>
        <tbody class=" divide-y divide-gray-100">
          <tr v-for="(item, index) in acoustInfoList" 
            :key="index" 
            :class="{' bg-cyan-100': selectedRow == index}"
            @click="handleRowSelect(index)"
          >
            <td class=" p-1 text-center">{{ item.score.toFixed(2) }}</td>
            <td class=" p-1">{{ item.title }}</td>
            <td class=" p-1">{{ join_names(item.artists) }}</td>
            <td class=" p-1 text-center">{{ formatTimeDuration(item.duration) }}</td>
            <td class=" p-1">{{ item.release_title }}<span class=" text-sm text-gray-400">({{ item.release_track_count }})</span></td>
            <td class=" p-1 text-center">{{ item.release_year }}</td>
            <td class=" p-1 text-center">{{ item.release_country }}</td>
            <td class=" p-1">{{ join_names(item.release_artists) }}</td>
          </tr>
        </tbody>
      </table>
      <div class=" mx-auto p-2 text-center" v-if="acoustInfoList_loading">matching...</div>
      <div class=" mx-auto p-2 text-center" v-else-if="!acoustInfoList.length">no result</div>
    </div>
    <div class=" flex-none p-1 text-right">
      <button type="button" 
        class="  h-6 min-w-28 px-1 mr-2 py-0 disabled:bg-gray-500 disabled:cursor-auto" 
        :disabled="selectedRow<0" 
        @click="handleConfirm"
      >Match{{ (mcLoaded && useNewCoverArt) ? '(Use matched Cover Art)' : '' }}</button>
      <button type="button" class="  h-6 w-28 px-1 py-0" @click="emits('close')">Cancel</button>
    </div>
  </div>
</template>