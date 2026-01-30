<script setup lang="ts">
import type { Method } from 'alova';
import { useTemplateRef, ref, watch } from 'vue';

const props = defineProps<{
  initialSrc: string,
  defaultSrc: string,
  uploadMethod: (formData: FormData) => Method,
  methodOptions: Record<string, any>,
}>()
const emits = defineEmits(['uploaded'])
const imgFile = useTemplateRef('imgFile')
const imgSrc = ref(props.initialSrc)
const uploadProgress = ref(0)

watch(() => props.initialSrc, (newVal) => {
  imgSrc.value = newVal
})
const triggleSelect = () => {
  if (imgFile.value !== null) {
    imgFile.value.click()
  }
}
const handleChange = (e: Event) => { 
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const imgSelected = target.files[0]
    const reader = new FileReader()
    reader.readAsDataURL(imgSelected)
    reader.onload = function(e) {
      if(e.target) {
        imgSrc.value = e.target.result as string
      }
    }
    const formData = new FormData()
    formData.append('file', imgSelected)
    for (const key in props.methodOptions) {
      if (props.methodOptions.hasOwnProperty(key))
        formData.append(key, props.methodOptions[key])
    }
    const uploadMethod = props.uploadMethod(formData)
    uploadMethod.onUpload((progressEvent) => {
      uploadProgress.value = Math.round(progressEvent.loaded * 100 / progressEvent.total)
    })
    uploadMethod.then((res:string) => {
      uploadProgress.value = 0
      emits('uploaded', res)
    })
  }
}
</script>

<template>
  <div v-bind="$attrs" @click="triggleSelect">
    <img :src="imgSrc" v-default-src="defaultSrc" class=" w-full h-full inline-block object-cover cursor-pointer" title="点击更换图片" />
    <div class=" mx-2 w-[calc(100%-(--spacing(4)))] h-[2px]">
      <div class=" h-[2px] bg-cyan-500" :style="{width: uploadProgress + '%'}"></div>
    </div>
    <input type="file" class=" hidden" ref="imgFile" @change="handleChange" />
  </div>
</template>