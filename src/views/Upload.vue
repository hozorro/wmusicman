<script setup lang="ts">
import { ref, computed, inject } from 'vue';
import type { AlovaFileItem } from 'alova/client';
import { useUploader } from 'alova/client';
import WUpload from '@/components/WUpload.vue';
import { uploadFile } from '@/apis/methods/manage';
import { formatSize } from '@/utils/general';
import { busyState, type BusyState } from '@/composables/busy';

// While a global task is running, uploading is disabled (read-only view)
const busy = inject<BusyState | null>(busyState, null)?.busy ?? computed(() => false)

const uploadQueue = ref<AlovaFileItem[]>();
const uploadingCount = ref(0);
const needUpload = ref<AlovaFileItem[]>()
const { fileList, appendFiles, removeFiles, onSuccess, upload } = useUploader(({file, name}) => uploadFile(file, name), {limit: 3});

function checkUpload() {
  needUpload.value = uploadQueue.value?.filter(item => item.status == 0) || []
  while (needUpload.value.length > 0 && uploadingCount.value < 3) {
    let item = needUpload.value.shift()
    if (item) {
      appendFiles([item])
      upload(item)
      uploadingCount.value++
    }
  }
}
function handleUpload(files: File[]) {
  let fileItems = files.map(file => ({file, status:0 as 0|1|2|3, progress: {uploaded: 0, total: 0}}))
  if (uploadQueue.value) {
    uploadQueue.value.push(...fileItems)
  } else {
    uploadQueue.value = fileItems
  }
  checkUpload()
}
onSuccess((event) => {
  uploadingCount.value--
  const data = event.data as {filename: string}
  if (uploadQueue.value) {
    const fileItem = uploadQueue.value.find(item => item.file.name === data.filename)
    if (fileItem) {
      const uploadItem = fileList.value.find(item => item.file.name === data.filename)
      if (uploadItem) {
        removeFiles(uploadItem)
        fileItem.status = 2
        checkUpload()
      }
    }
  }
})
</script>

<template>
  <div class="flex flex-col gap-4 animate-fade-in">
    <div class="page-head">
      <div>
        <h1>上传音乐</h1>
        <p>选择文件加入上传队列，自动开始上传</p>
      </div>
    </div>

    <div :class="{ 'pointer-events-none opacity-50': busy }">
      <w-upload id="my-file" multiple @upload-file="handleUpload" />
    </div>

    <div class="card">
      <div class="card-header">
        <h2>上传队列</h2>
        <span class="sp"></span>
        <span v-if="uploadQueue?.length" class="tag tag-gray num">{{ uploadQueue.length }} 个文件</span>
      </div>
      <div v-if="uploadQueue?.length">
        <div v-for="f in uploadQueue" :key="f.file.name" class="file-item">
          <div class="f-ico">
            <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
              <path d="M216.76,38.52a8,8,0,0,0-6.86-1.45l-128,32A8,8,0,0,0,72,76.67V155.1A36,36,0,1,0,88,184V84.1l112-28v71A36,36,0,1,0,216,152V44A8,8,0,0,0,216.76,38.52Z"/>
            </svg>
          </div>
          <div class="f-info">
            <div class="f-name">{{ f.file.name }}</div>
            <div class="f-meta num">{{ formatSize(f.progress.uploaded) }} / {{ formatSize(f.progress.total) }}</div>
          </div>
          <template v-if="f.status === 1">
            <div class="progress progress-striped f-progress">
              <div class="bar" :style="{ width: (f.progress.total == 0 ? 0 : f.progress.uploaded / f.progress.total * 100) + '%' }"></div>
            </div>
            <span class="text-[11.5px] text-ink-3 font-semibold w-12 text-right num">{{ f.progress.total == 0 ? '0%' : (f.progress.uploaded / f.progress.total * 100).toFixed(1) + '%' }}</span>
            <span class="tag tag-cyan">上传中</span>
          </template>
          <span v-else-if="f.status === 2" class="tag tag-ok">完成</span>
          <span v-else-if="f.status === 3" class="tag tag-bad" :title="f.error?.message">失败</span>
          <span v-else class="tag tag-gray">等待</span>
        </div>
      </div>
      <div v-else class="state-box !py-10">
        <b>暂无文件</b>
        <span>选择文件后自动加入队列并上传</span>
      </div>
    </div>
  </div>
</template>