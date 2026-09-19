<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: File | File[] | null
    accept?: string
    multiple?: boolean
  }>(),
  { multiple: false }
)

const emit = defineEmits<{
  (e: 'update:modelValue', files: File | File[] | null): void
  (e: 'change', files: File | File[] | null): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)

// 统一把 modelValue 归一到数组，方便渲染
const fileList = computed<File[]>(() => {
  const v = props.modelValue
  if (!v) return []
  return Array.isArray(v) ? v : [v]
})

const displayText = computed(() => {
  const list = fileList.value
  if (!list.length) return '点击选择文件'
  if (list.length === 1) return list[0].name
  return `${list[0].name} 等 ${list.length} 个文件`
})

function trigger() {
  inputRef.value?.click()
}

function onChange(e: Event) {
  const input = e.target as HTMLInputElement
  const files = input.files ? Array.from(input.files) : []

  let payload: File | File[] | null
  if (props.multiple) {
    payload = files.length ? files : null
  } else {
    payload = files.length ? files[0] : null
  }

  emit('update:modelValue', payload)
  emit('change', payload)

  // 允许重复选择同一个文件
  input.value = ''
}
</script>

<template>
  <div
    class="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-2 text-gray-500 transition-colors hover:border-primary hover:text-primary"
    @click="trigger"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none"
         viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
      <path stroke-linecap="round" stroke-linejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 7.5 7.5 12M12 7.5V21" />
    </svg>

    <span class="truncate text-sm">{{ displayText }}</span>

    <input
      ref="inputRef"
      type="file"
      class="hidden"
      :accept="accept"
      :multiple="multiple"
      @change="onChange"
    />
  </div>
</template>