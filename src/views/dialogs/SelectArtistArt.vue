<script setup lang="ts">
import { ref, computed, onMounted, useTemplateRef, inject } from 'vue'
import { useRequest } from 'alova/client'
import { busyState, type BusyState } from '@/composables/busy'
import { getArtistArtCandidates, uploadArtistArtCandidate, setArtistArt, createArtistDir } from '@/apis/methods/manage'
import { invalidateCache } from 'alova'
import type { ApiError } from '@/errors/apiError'
import { transformApiError } from '@/errors/transform'

// While any global task is running, selection/upload entries are disabled
const busy = inject<BusyState | null>(busyState, null)?.busy ?? computed(() => false)

const props = defineProps<{
  artistId: number,
  artistName: string,
  artType: 'face' | 'portrait',
  currentUrl: string,
}>()

const emits = defineEmits(['confirm', 'close'])
const selectedFile = ref<string>('')
const isUploading = ref(false)
const uploadProgress = ref(0)
const fileInputRef = useTemplateRef('fileInput')
const artist_dir = ref('')

const baseURL = import.meta.env.VITE_BASE_URL

const { data, loading, error, send: refreshCandidates } = useRequest(
  () => getArtistArtCandidates(props.artistId, props.artType),
  { immediate: false }
)

onMounted(() => { 
  refreshCandidates().then(() => artist_dir.value = data.value?.artist_dir || '')
})

function getImgUrl(filename: string) {
  return baseURL + `artwork/candidates/${props.artistId}/${filename}?t=${Date.now()}`
}

function selectFile(filename: string) {
  selectedFile.value = selectedFile.value === filename ? '' : filename
}

const { data: setArtData, loading: settingArt, error: setArtError, send: setArt } = useRequest(
  () => setArtistArt(props.artistId, props.artType, selectedFile.value),
  { immediate: false }
)

function handleConfirm() {
  if (!selectedFile.value) return
  setArt().then(() => {
    emits('confirm', { close: true, payload: setArtData.value })
  })
}

const {data: created_artist_dir, loading: creating, error: createError, send: createArtistDirectory} = useRequest(
  (lang) => createArtistDir(props.artistName, lang),
  { immediate: false }
)
async function handleCreateArtistDir(lang: 'CN' | 'FR') {
  await createArtistDirectory(lang)
  artist_dir.value = created_artist_dir.value
}

// 上传本地图片
function triggerUpload() {
  if (busy.value) return
  fileInputRef.value?.click()
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  isUploading.value = true
  uploadProgress.value = 0

  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('artist_id', props.artistId.toString())
    formData.append('art_type', props.artType)

    const upload = uploadArtistArtCandidate(formData)
    upload.onUpload((progressEvent) => {
      uploadProgress.value = Math.round(progressEvent.loaded * 100 / progressEvent.total)
    })
    await upload.send()

    // 上传成功后刷新候选列表
    invalidateCache(getArtistArtCandidates(props.artistId, props.artType))
    await refreshCandidates()
  } catch (err) {
    console.error('Upload candidate failed', err)
    alert('上传失败，请重试')
  } finally {
    isUploading.value = false
    uploadProgress.value = 0
    target.value = '' // 允许重复选择同一文件
  }
}
</script>

<template>
  <div class="w-[500px]">
    <div v-if="loading" class="state-box !py-8">加载中...</div>
    <div v-else-if="error" class="state-box !py-8"><b>加载失败</b><span class="!text-bad">{{ error.message }}</span></div>
    <div v-else>
      <!-- 候选图片网格 -->
      <div class=" flex justify-between items-center">
        <div class=" flex-1 text-sm text-ink-2">歌手文件夹：
          <span v-if="creating" class="text-xs text-ink-3 italic">创建中...</span>
          <span v-else-if="createError" class="text-xs text-bad italic">{{ transformApiError(createError as ApiError) }}</span>
          <span v-else>{{ artist_dir || '无' }}</span>
        </div>
        <div class=" flex-none">
          <button type="button" v-if="!artist_dir" class="btn btn-sm" @click="handleCreateArtistDir('CN')">创建(CN)</button>
          <button type="button" v-if="!artist_dir" class="btn btn-sm ml-2" @click="handleCreateArtistDir('FR')">创建(FR)</button>
        </div>
      </div> 
      <div class="grid grid-cols-4 gap-2.5 max-h-96 overflow-y-auto p-0.5 mt-2 border-dashed border-[1px] border-ink-3/50 rounded-md">
        <div 
          v-for="filename in data?.candidates" 
          :key="filename"
          class="cursor-pointer rounded-r overflow-hidden border-2 relative transition-all"
          :class="selectedFile === filename ? 'border-accent ring-2 ring-glow' : 'border-transparent hover:border-line-strong'"
          @click="selectFile(filename)"
        >
          <img 
            :src="getImgUrl(filename)" 
            class="w-full aspect-square object-cover"
          />
          <div class="text-[11.5px] text-center py-1 text-ink-3 truncate">{{ filename }}</div>
          <!-- 选中标记 -->
          <div v-if="selectedFile === filename" class="absolute top-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
            <svg width="11" height="11" viewBox="0 0 256 256" fill="#fff">
              <path d="M104,196a12.2,12.2,0,0,1-8.5-3.5l-56-56a12,12,0,0,1,17-17L104,167,207.5,63.5a12,12,0,0,1,17,17l-112,112A12.2,12.2,0,0,1,104,196Z"></path>
            </svg>
          </div>
        </div>

        <!-- 上传区域 -->
        <div 
          class="cursor-pointer rounded-r border-2 border-dashed border-line-strong flex flex-col items-center justify-center aspect-square hover:border-accent hover:bg-accent-soft transition-colors relative"
          :class="{ 'opacity-50 pointer-events-none': isUploading || busy }"
          @click="triggerUpload"
        >
          <div v-if="isUploading" class="absolute inset-0 flex flex-col items-center justify-center">
            <div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-1"></div>
            <span class="text-xs text-accent num">{{ uploadProgress }}%</span>
          </div>
          <template v-else>
            <svg width="26" height="26" viewBox="0 0 256 256" fill="currentColor" class="text-ink-3">
              <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
            </svg>
            <span class="text-xs text-ink-3 mt-1">上传本地图片</span>
          </template>
        </div>
      </div>

      <div v-if="data?.candidates?.length === 0" class="text-center py-4 text-ink-3 text-[13px]">
        暂无候选图片，请上传
      </div>
    </div>
    <div class="mt-4 p-2 bg-amber-200/10 rounded-md border border-amber-100/70 text-xs text-ink-3">
      改变图片后需要在播放器中同步曲库以刷新图片hash，否则前端图片缓存不会主动更新。
    </div>

    <!-- 底部操作栏 -->
    <div class="mt-4 pt-3 flex justify-between border-t border-line">
      <div class=" text-sm">
        <span v-if="setArtError" class=" text-bad-ink">{{ setArtError.message }}</span>
      </div>
      <div class="flex gap-2 flex-none">
        <button type="button" class="btn" @click="emits('close')">取消</button>
        <button 
          type="button" 
          class="btn btn-primary" 
          :disabled="busy || !selectedFile" 
          @click="handleConfirm"
        >{{ settingArt ? '正在设置...' : '确认选择' }}</button>
      </div>
    </div>

    <!-- 隐藏的文件输入 -->
    <input 
      ref="fileInput" 
      type="file" 
      accept="image/*" 
      class="hidden" 
      @change="handleFileChange" 
    />
  </div>
</template>
