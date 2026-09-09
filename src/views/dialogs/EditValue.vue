<script setup lang="ts">
import { ref, computed, onMounted, nextTick, useTemplateRef, inject } from 'vue'
import { busyState, type BusyState } from '@/composables/busy'

// While any global task is running, submit is disabled (read-only)
const busy = inject<BusyState | null>(busyState, null)?.busy ?? computed(() => false)

const props = defineProps<{
  value: string | number,
  isDifferent: boolean
}>()
const emits = defineEmits(['close', 'confirm', 'select'])
const inputValue = ref<string | number>('')
const inputRef = useTemplateRef('inputRef')
onMounted(() => {
  inputValue.value = props.value
  nextTick(() => inputRef.value?.focus())
})
const handleConfirm = () => {
  if (typeof inputValue.value == 'string') inputValue.value = inputValue.value.trim()
  if (!inputValue.value || inputValue.value == props.value) emits('close')
  emits('confirm', inputValue.value)
}
</script>

<template>
  <div>
    <input v-model="inputValue" ref="inputRef"
      :type="typeof value == 'number' ? 'number' : 'text'"
      :placeholder="isDifferent ? '**多个不同值**' : ''"
      class="input w-full"
      :disabled="busy"
    />
  </div>
  <div class="mt-5 flex justify-end gap-2">
    <button type="button" class="btn" @click="emits('close')">Cancel</button>
    <button type="button" class="btn btn-primary" :disabled="busy || !inputValue || inputValue == value" @click="handleConfirm">Confirm</button>
  </div>
</template>
