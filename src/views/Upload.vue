<script setup lang="ts">
import { ref } from 'vue';
import type { AlovaFileItem } from 'alova/client';
import { useUploader } from 'alova/client';
import WUpload from '@/components/WUpload.vue';
import { uploadFile } from '@/apis/methods/manage';

const uploadQueue = ref<AlovaFileItem[]>();
// let fileItemInit = {
//   status: 0 as 0|1|2|3,
//   progress: {uploaded: 0, total: 0}
// }
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
  const data = event.data as ResponseData<string>
  if (uploadQueue.value) {
    const fileItem = uploadQueue.value.find(item => item.file.name === data.data)
    if (fileItem) {
      const uploadItem = fileList.value.find(item => item.file.name === data.data)
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
  <div class=" flex flex-col h-full">
    <div class=" flex-1 overflow-y-auto">
      <div class=" w-full bg-white rounded-md">
        <template v-for="f in uploadQueue">
          <div class=" w-full flex h-10 py-2 even:bg-gray-100">
            <div class=" flex-1 pl-4">{{ f.file.name }}</div>
            <div class=" flex-none w-40">
              <span v-if="f.status === 1" class=" block h-6 bg-cyan-600 text-gray-300 text-center" 
                :style="{width: f.progress.total == 0 ? 0 : f.progress.uploaded / f.progress.total * 100 + '%'}">
                {{ f.progress.total == 0 ? '' : (f.progress.uploaded / f.progress.total * 100).toFixed(2) + '%' }}
              </span>
              <span v-else-if="f.status === 2" class=" w-full block h-6 bg-cyan-600 text-gray-300 text-center">100%</span>
              <span v-else-if="f.status === 3">{{ f.error?.message }}</span>
            </div>
            <div class=" flex-none w-56 pr-2 text-right">{{ f.progress.uploaded }} / {{ f.progress.total }}</div>
          </div>
        </template>
      </div>
    </div>
    <div class=" flex-none mt-2">
      <w-upload id="my-file" multiple @upload-file="handleUpload" />
    </div>
  </div>
</template>