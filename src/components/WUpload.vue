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
  <label :for="id" class=" block h-64 relative overflow-hidden rounded-md p-2">
    <input type="file" :id="id" class="overlayed block" :multiple="multiple" @change="handleUpload" />
    <span class="overlayed pointer-events-none flex justify-center items-center bg-amber-50 border-amber-300 border-dotted border-2">
      <div class=" text-center">
        <slot>
          <strong>+ Upload Files</strong>
        </slot>
        <small v-if="files.length" class=" text-cyan-500 block">
          <slot name="file" :files="files" :uploadInfo="uploadInfo">
            {{ uploadInfo }}
          </slot>
        </small>
      </div>
    </span>
  </label>
</template>

<style scoped>
@reference 'tailwindcss';
.overlayed {
  @apply absolute inset-0 w-full;
}
</style>