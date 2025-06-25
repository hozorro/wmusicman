<script setup lang="ts">
import { ref } from 'vue';

const { cellData = ''} = defineProps<{ cellData: string }>();
const isEditing = ref(false);
const tmpData = ref(cellData)
const originalData = ref(cellData)

const emits = defineEmits(['updateValue'])

function handleDbClick() {
  if (!isEditing.value) {
    isEditing.value = true
    tmpData.value = originalData.value
  }
}
function handleBlur() {
  if (isEditing.value && tmpData.value !== originalData.value) {
    alert('value changed, enter to confirm')
  } else {
    isEditing.value = false
  }
}
function handleEnter() {
  if (isEditing.value) {
    isEditing.value = false
    if (tmpData.value !== originalData.value) {
      originalData.value = tmpData.value
      emits('updateValue', tmpData.value)
    }
  }
}
</script>

<template>
  <div>
    <div v-if="isEditing">
      <input
        type="text"
        class=" w-full border border-gray-300 rounded-md"
        v-model="tmpData"
        @blur="handleBlur"
        @keyup.enter="handleEnter"
      />
    </div>
    <div v-else>
      <span @dblclick="handleDbClick">{{ cellData }}</span>
    </div>
  </div>
</template>