<script setup lang="ts">
import { computed, ref, onUnmounted, inject } from 'vue'
import { useRequest } from 'alova/client';
import { busyState, type BusyState } from '@/composables/busy'
import { formatTimeDuration } from '@/utils/general'
import { generateFingerprint, matchFingerprint } from '@/apis/methods/manage'
import { toast } from '@/composables/toast';

// While any global task is running, match operations are disabled (read-only)
const busy = inject<BusyState | null>(busyState, null)?.busy ?? computed(() => false)

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
      toast('Cover not loaded!', 'warning')
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
  <div class="flex flex-col h-136 w-240">
    <div class="flex-none flex gap-3 border-b border-line pb-3">
      <div class="flex-none w-60">
        <div class="h-6 text-[13px] font-semibold text-ink-1">Original Info</div>
        <div class="mt-2 p-2.5 bg-panel border border-line text-[12.5px] rounded-r">
          <div class="grid grid-cols-[3.5rem_1fr] gap-1.5" v-for="(v, k, i) in props_show" :key="i">
            <div class="font-semibold text-ink-2">{{ k }}:</div>
            <div class="break-all text-ink-2">{{ v instanceof Array ? v.join(',') : v }}</div>
          </div>
        </div>
        <div class="mt-2 p-2.5 bg-warn-soft text-[12.5px] rounded-r text-warn-ink">duration: 
          <span v-if="fp_loading">caculating...</span>
          <span v-else class="num">{{ duration ? formatTimeDuration(duration) : '--:--' }}</span>
        </div>
        <div class="mt-2 flex justify-center gap-2">
          <button type="button" class="btn btn-sm" :disabled="busy || fp_loading" @click="generateFp">Generate</button>
          <button type="button" class="btn btn-sm btn-primary" :disabled="busy || acoustInfoList_loading || !fp" @click="search">Search</button>
        </div>
      </div>
      <div class="flex-1 flex flex-col h-78">
        <div class="flex-none h-6 text-[13px] font-semibold text-ink-1">Fingerprint</div>
        <div class="flex-1 mt-2 p-2.5 bg-warn-soft text-[11.5px] rounded-r break-all overflow-y-auto text-warn-ink font-mono">
          <span v-if="fp_loading">generating...</span>
          <span v-else>{{ fp }}</span>
        </div>
      </div>
      <div class="flex-none flex flex-col gap-2 w-30">
        <div class="flex-none text-[13px] font-semibold text-ink-1">Cover Art</div>
        <div class="flex-none text-[12.5px] text-ink-2">
          <label class="check"><input type="checkbox" v-model="useNewCoverArt" :disabled="busy" />Use matched</label>
        </div>
        <div class="flex-none p-2 bg-panel border border-line rounded-r">
          <div class="flex place-content-center w-full aspect-square">
            <div v-if="ogLoadFailed" class="h-fit text-center text-[12px] text-ink-3">no original cover</div>
            <img v-else :src="props.cover" class="w-full h-full object-cover rounded-r" @error="ogLoadFailed=true">
          </div>
        </div>
        <div class="flex-none p-2 bg-warn-soft rounded-r">
          <div class="flex place-content-center w-full aspect-square">
            <div v-if="mcsUrl" class="relative">
              <div v-if="mcLoading" class="absolute inset-0 flex items-center justify-center text-[12px] text-warn-ink">matching cover...</div>
              <div v-else-if="mcLoadFailed" class="absolute inset-0 flex items-center justify-center text-[12px] text-bad">match failed</div>
              <img 
                :src="mcsUrl" 
                class="w-full h-full object-cover rounded-r"
                :class="{'opacity-0': mcLoading||mcLoadFailed}"
                @load="handleMatchCoverSuccess"
                @error="handleMatchCoverFailed"
              >
            </div>
            <div v-else class="h-fit text-center text-[12px] text-warn-ink">no img</div>
          </div>
        </div>
      </div>
    </div>
    <div class="flex-1 w-full mt-2 overflow-y-auto text-[13px]">
      <table class="tbl"> 
        <thead class="sticky top-0">
          <tr>
            <th class="w-16">Score</th>
            <th>Title</th>
            <th>Artist</th>
            <th class="w-16">Dura</th>
            <th>Album</th>
            <th class="w-14">Year</th>
            <th class="w-18">Country</th>
            <th>Alb Artist</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in acoustInfoList" 
            :key="index" 
            class="cursor-pointer"
            :class="{'!bg-accent-soft': selectedRow == index}"
            @click="handleRowSelect(index)"
          >
            <td class="text-center num">{{ item.score.toFixed(2) }}</td>
            <td>{{ item.title }}</td>
            <td>{{ join_names(item.artists) }}</td>
            <td class="text-center num">{{ formatTimeDuration(item.duration) }}</td>
            <td>{{ item.release_title }}<span class="text-ink-3">({{ item.release_track_count }})</span></td>
            <td class="text-center num">{{ item.release_year }}</td>
            <td class="text-center">{{ item.release_country }}</td>
            <td>{{ join_names(item.release_artists) }}</td>
          </tr>
        </tbody>
      </table>
      <div class="p-3 text-center text-ink-3" v-if="acoustInfoList_loading">matching...</div>
      <div class="p-3 text-center text-ink-3" v-else-if="!acoustInfoList.length">no result</div>
    </div>
    <div class="flex-none pt-3 flex justify-end gap-2">
      <button type="button" class="btn" @click="emits('close')">Cancel</button>
      <button type="button" 
        class="btn btn-primary" 
        :disabled="busy || selectedRow<0" 
        @click="handleConfirm"
      >Match{{ (mcLoaded && useNewCoverArt) ? '(Use matched Cover Art)' : '' }}</button>
    </div>
  </div>
</template>