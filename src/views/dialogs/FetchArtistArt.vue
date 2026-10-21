<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { useRequest } from 'alova/client'
import { busyState, type BusyState } from '@/composables/busy'
import {
  getArtistArtCandidates, createArtistDir,
  fetchArtistArt, confirmArtistArt, transformTempArtistArt
} from '@/apis/methods/manage'
import type { ApiError } from '@/errors/apiError'
import { transformApiError } from '@/errors/transform'

// While any global task is running, fetch/confirm entries are disabled
const busy = inject<BusyState | null>(busyState, null)?.busy ?? computed(() => false)

const props = defineProps<{
  artistId: number,
  artistName: string,
}>()

const emits = defineEmits(['confirm', 'close'])

const artist_dir = ref('')

// 仅获取歌手目录（face/portrait 同目录，取 face 的候选接口即可）
const { data: candidatesData, send: refreshDir } = useRequest(
  () => getArtistArtCandidates(props.artistId, 'face'),
  { immediate: false }
)

onMounted(() => {
  refreshDir().then(() => artist_dir.value = candidatesData.value?.artist_dir || '')
})

const { data: created_artist_dir, loading: creating, error: createError, send: createArtistDirectory } = useRequest(
  (lang) => createArtistDir(props.artistName, lang),
  { immediate: false }
)
async function handleCreateArtistDir(lang: 'CN' | 'FR') {
  await createArtistDirectory(lang)
  artist_dir.value = created_artist_dir.value
}

// 抓取第三方图片
const fetched = ref(false)
const faceTempId = ref<string | null>(null)
const portraitTempId = ref<string | null>(null)
const faceImgUrl = ref('')
const portraitImgUrl = ref('')
const adoptFace = ref(false)
const adoptPortrait = ref(false)

const { data: fetchData, loading: fetching, error: fetchError, send: doFetch } = useRequest(
  () => fetchArtistArt(props.artistName),
  { immediate: false }
)

async function handleFetch() {
  if (busy.value || !artist_dir.value) return
  await doFetch()
  const res = fetchData.value
  if (!res) return
  faceTempId.value = res.face_temp_id
  portraitTempId.value = res.portrait_temp_id
  faceImgUrl.value = res.face_temp_id ? `${transformTempArtistArt(res.face_temp_id)}?t=${Date.now()}` : ''
  portraitImgUrl.value = res.portrait_temp_id ? `${transformTempArtistArt(res.portrait_temp_id)}?t=${Date.now()}` : ''
  adoptFace.value = false
  adoptPortrait.value = false
  fetched.value = true
}

// 确认保存
const confirming = ref(false)
const confirmError = ref('')
const setDirectly = ref(true)

async function handleConfirm() {
  if (busy.value || (!adoptFace.value && !adoptPortrait.value)) return
  confirming.value = true
  confirmError.value = ''
  const saved = { face: false, portrait: false }
  try {
    if (adoptFace.value && faceTempId.value) {
      await confirmArtistArt(props.artistId, 'face', faceTempId.value, setDirectly.value)
      saved.face = true
    }
    if (adoptPortrait.value && portraitTempId.value) {
      await confirmArtistArt(props.artistId, 'portrait', portraitTempId.value, setDirectly.value)
      saved.portrait = true
    }
    emits('confirm', { close: true, payload: saved })
  } catch (err) {
    confirmError.value = transformApiError(err as ApiError)
    // 部分成功时也提示用户哪些已保存
    if (saved.face || saved.portrait) {
      alert(`部分保存成功：${saved.face ? 'face ' : ''}${saved.portrait ? 'portrait' : ''}`)
    }
  } finally {
    confirming.value = false
  }
}
</script>

<template>
  <div class="w-[500px]">
    <!-- 歌手目录行 -->
    <div class="flex justify-between items-center">
      <div class="flex-1 text-sm text-ink-2">歌手文件夹：
        <span v-if="creating" class="text-xs text-ink-3 italic">创建中...</span>
        <span v-else-if="createError" class="text-xs text-bad italic">{{ transformApiError(createError as ApiError) }}</span>
        <span v-else>{{ artist_dir || '无' }}</span>
      </div>
      <div class="flex-none">
        <button type="button" v-if="!artist_dir" class="btn btn-sm" @click="handleCreateArtistDir('CN')">创建(CN)</button>
        <button type="button" v-if="!artist_dir" class="btn btn-sm ml-2" @click="handleCreateArtistDir('FR')">创建(FR)</button>
      </div>
    </div>
    <div class=" mt-2 flex gap-2 align-bottom items-center">
      <button
          type="button"
          class="btn"
          :disabled="busy || !artist_dir || fetching || confirming"
          @click="handleFetch"
        >{{ fetching ? '抓取中...' : '抓取' }}</button>
        <div class=" text-sm text-ink-3">从第三方API抓取图片，抓取前需确保歌手文件夹已存在</div>
    </div>

    <!-- 中部抓取结果区 -->
    <div class="mt-3 min-h-40 border-dashed border-[1px] border-ink-3/50 rounded-md">
      <div v-if="fetching" class="state-box !py-8">正在从第三方抓取图片...</div>
      <div v-else-if="!fetched" class="state-box !py-8 text-ink-3 text-[13px]">
        {{ artist_dir ? '点击上方「抓取」按钮从第三方获取歌手图片' : '请先创建歌手文件夹，然后再抓取' }}
      </div>
      <div v-else class="flex gap-4">
        <!-- Face -->
        <div class="flex-none w-40">
          <div
            class="rounded-r overflow-hidden border-2 relative transition-all"
            :class="faceTempId ? (adoptFace ? 'border-accent ring-2 ring-glow' : 'border-transparent hover:border-line-strong') : 'border-line'"
          >
            <img v-if="faceImgUrl" :src="faceImgUrl" class="w-full aspect-square object-cover" />
            <div v-else class="w-full aspect-square flex items-center justify-center bg-panel text-ink-3 text-xs">未抓取到</div>
          </div>
          <div class="flex items-center justify-center gap-1.5 mt-1.5">
            <span class="text-xs text-ink-3">Face</span>
            <button
              v-if="faceTempId"
              type="button"
              class="chip text-xs !py-0.5"
              :class="{ 'chip-on': adoptFace }"
              @click="adoptFace = !adoptFace"
            >采用</button>
          </div>
        </div>
        <!-- Portrait -->
        <div class="flex-1">
          <div
            class="rounded-r overflow-hidden border-2 relative transition-all"
            :class="portraitTempId ? (adoptPortrait ? 'border-accent ring-2 ring-glow' : 'border-transparent hover:border-line-strong') : 'border-line'"
          >
            <img v-if="portraitImgUrl" :src="portraitImgUrl" class="w-full h-40 object-cover" />
            <div v-else class="w-full h-40 flex items-center justify-center bg-panel text-ink-3 text-xs">未抓取到</div>
          </div>
          <div class="flex items-center justify-center gap-1.5 mt-1.5">
            <span class="text-xs text-ink-3">Portrait</span>
            <button
              v-if="portraitTempId"
              type="button"
              class="chip text-xs !py-0.5"
              :class="{ 'chip-on': adoptPortrait }"
              @click="adoptPortrait = !adoptPortrait"
            >采用</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 直接设为当前 artwork 选项 -->
    <div class="mt-3">
      <label class="check text-sm text-ink-2">
        <input type="checkbox" v-model="setDirectly" :disabled="busy || confirming" />
        直接设为当前artwork<span class="text-xs text-ink-3">（设为 face_1/portrait_1 并更新图片hash）</span>
      </label>
    </div>

    <div class="mt-4 p-2 bg-amber-200/10 rounded-md border border-amber-100/70 text-xs text-ink-3">
      改变图片后需要在播放器中同步曲库以刷新图片hash，否则前端图片缓存不会主动更新。
    </div>

    <!-- 底部操作栏 -->
    <div class="mt-4 pt-3 flex justify-between border-t border-line">
      <div class="text-sm">
        <span v-if="fetchError" class="text-bad-ink">{{ transformApiError(fetchError as ApiError) }}</span>
        <span v-else-if="confirmError" class="text-bad-ink">{{ confirmError }}</span>
      </div>
      <div class="flex gap-2 flex-none">
        <button type="button" class="btn" @click="emits('close')">取消</button>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="busy || (!adoptFace && !adoptPortrait) || confirming || fetching"
          @click="handleConfirm"
        >{{ confirming ? '正在保存...' : '确认保存' }}</button>
      </div>
    </div>
  </div>
</template>
