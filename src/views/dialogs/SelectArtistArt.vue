<script setup lang="ts">
import { ref, onMounted, useTemplateRef } from 'vue'
import { useRequest } from 'alova/client'
import { getArtistArtCandidates, uploadArtistArtCandidate } from '@/apis/methods/manage'

const props = defineProps<{
  artistId: number,
  artistName: string,
  artType: 'face' | 'portrait',
  currentUrl: string,
}>()

const emits = defineEmits(['select', 'confirm', 'close'])
const selectedFile = ref<string>('')
const isUploading = ref(false)
const uploadProgress = ref(0)
const fileInputRef = useTemplateRef('fileInput')

const baseURL = import.meta.env.VITE_BASE_URL

const { data, loading, error, send: refreshCandidates } = useRequest(
  () => getArtistArtCandidates(props.artistId, props.artType),
  { immediate: false }
)

onMounted(() => { refreshCandidates() })

function getImgUrl(filename: string) {
  return baseURL + `artwork/candidates/${props.artistId}/${filename}?t=${Date.now()}`
}

function selectFile(filename: string) {
  selectedFile.value = selectedFile.value === filename ? '' : filename
}

function handleConfirm() {
  if (!selectedFile.value) return
  emits('select', { close: true, payload: selectedFile.value })
}

// 上传本地图片
function triggerUpload() {
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
    await upload

    // 上传成功后刷新候选列表
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
    <div v-if="loading" class="text-center p-4">加载中...</div>
    <div v-else-if="error" class="text-center p-4 text-red-500">{{ error.message }}</div>
    <div v-else>
      <!-- 候选图片网格 -->
      <div class="grid grid-cols-4 gap-2 max-h-96 overflow-y-auto p-2">
        <div 
          v-for="filename in data?.candidates" 
          :key="filename"
          class="cursor-pointer rounded-md overflow-hidden border-2 relative"
          :class="selectedFile === filename ? 'border-cyan-500 ring-2 ring-cyan-300' : 'border-transparent hover:border-gray-300'"
          @click="selectFile(filename)"
        >
          <img 
            :src="getImgUrl(filename)" 
            class="w-full aspect-square object-cover"
          />
          <div class="text-xs text-center py-1 text-gray-500 truncate">{{ filename }}</div>
          <!-- 选中标记 -->
          <div v-if="selectedFile === filename" class="absolute top-1 right-1 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center">
            <span class="text-white text-xs">✓</span>
          </div>
        </div>

        <!-- 上传区域 -->
        <div 
          class="cursor-pointer rounded-md border-2 border-dashed border-gray-300 flex flex-col items-center justify-center aspect-square hover:border-cyan-400 hover:bg-cyan-50 transition-colors relative"
          :class="{ 'opacity-50 pointer-events-none': isUploading }"
          @click="triggerUpload"
        >
          <div v-if="isUploading" class="absolute inset-0 flex flex-col items-center justify-center">
            <div class="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-1"></div>
            <span class="text-xs text-cyan-600">{{ uploadProgress }}%</span>
          </div>
          <template v-else>
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span class="text-xs text-gray-400 mt-1">上传本地图片</span>
          </template>
        </div>
      </div>

      <div v-if="data?.candidates?.length === 0" class="text-center p-4 text-gray-400">
        暂无候选图片，请上传
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="mt-3 p-2 text-right border-t border-gray-200">
      <button 
        type="button" 
        class="h-7 w-28 px-1 mr-2 py-0 disabled:bg-gray-500 disabled:cursor-auto" 
        :disabled="!selectedFile" 
        @click="handleConfirm"
      >确认选择</button>
      <button type="button" class="h-7 w-28 px-1 py-0" @click="emits('close')">取消</button>
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
