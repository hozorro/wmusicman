<script setup lang="ts">
import { ref, computed } from 'vue'

const { id = 'drap-drop-input', multiple = false } = defineProps<{id: string, multiple: boolean}>()
const emits = defineEmits(['uploadFile'])
const files = ref<Array<File>>([])
const uploadInfo = computed(() => {
  return files.value.length === 1 ? files.value[0].name : files.value.length + ' files'
})
function handleUpload(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files) {
    files.value = Array.from(target.files)
  } else {
    files.value = []
  }
  emits('uploadFile', files.value)
}
</script>

<template>
  <label :for="id" class="upload-zone block relative">
    <input type="file" :id="id" class="hidden" :multiple="multiple" @change="handleUpload" />
    <div class="up-ico">
      <svg width="24" height="24" viewBox="0 0 256 256" fill="currentColor">
        <path d="M224,152a8,8,0,0,1-8,8H178.24l-14.13,25.71A8,8,0,0,1,157.5,192H126.7l-14.13,25.71A8,8,0,0,1,106.5,224H48a8,8,0,0,1,0-16H101.3l14.13-25.71A8,8,0,0,1,122.5,176h30.8l14.13-25.71A8,8,0,0,1,173.5,144H216A8,8,0,0,1,224,152ZM112,136V112H96a8,8,0,0,1-5.66-13.66l32-32a8,8,0,0,1,11.32,0l32,32A8,8,0,0,1,160,112h-16v24a8,8,0,0,1-16,0h-16Z"/>
      </svg>
    </div>
    <h3>
      <slot>
        <span>Upload Files</span>
      </slot>
    </h3>
    <p>Click to select files</p>
    <small v-if="files.length" class="block mt-2 text-accent text-[12px] font-medium">
      <slot name="file" :files="files" :uploadInfo="uploadInfo">
        {{ uploadInfo }}
      </slot>
    </small>
  </label>
</template>