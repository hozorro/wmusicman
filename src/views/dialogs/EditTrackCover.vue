<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import { busyState, type BusyState } from '@/composables/busy'
import WImgUploader from '@/components/WImgUploader.vue'

// While any global task is running, submit is disabled (read-only)
const busy = inject<BusyState | null>(busyState, null)?.busy ?? computed(() => false)

const props = defineProps<{
  trackId: number,
  trackTitle: string,
  currentCover: string,
}>()

const emits = defineEmits(['close', 'confirm'])

// 已选择但未上传的文件（WImgUploader 内部已处理本地预览）
const selectedFile = ref<File | null>(null)

function handleImgChange(payload: { file: File; url?: string; mode: 'auto' | 'manual' }) {
  // 手动模式：仅暂存文件，不上传
  selectedFile.value = payload.file
}

function handleConfirm() {
  if (!selectedFile.value) return
  emits('confirm', { trackId: props.trackId, file: selectedFile.value })
}
</script>

<template>
  <div class="w-80">
    <div class="text-sm text-ink-2 mb-3">
      为曲目 <b class="text-ink-1">{{ trackTitle }}</b> 修改封面图片
    </div>
    <div class="flex justify-center">
      <WImgUploader
        container-class="w-48 aspect-square"
        :model-value="currentCover"
        placeholder-text="无封面"
        :disabled="busy"
        @change="handleImgChange"
      />
    </div>
    <div class="mt-3 text-xs text-ink-3 text-center">
      点击上方图片区域选择本地图片
    </div>
    <div class="mt-5 flex justify-end gap-2">
      <button type="button" class="btn" @click="emits('close')">取消</button>
      <button
        type="button"
        class="btn btn-primary"
        :disabled="busy || !selectedFile"
        @click="handleConfirm"
      >确认修改</button>
    </div>
  </div>
</template>
