<script setup lang="ts">
import { computed, reactive } from 'vue';
import { openDialog } from '@/composables/wdialog';
import EditMulti from './EditMulti.vue';

const props = defineProps<{meta: MetaEditInput}>()
const emits = defineEmits(['close', 'confirm', 'select'])
const localValue = reactive(structuredClone(props.meta))
const resultValue = computed<MetaEditOutput>(() => {
  return {
    title: {value: localValue.title.uniformValue, isChanged: localValue.title.uniformValue != props.meta.title.uniformValue},
    artists: {value: localValue.artists.uniformValue, isChanged: JSON.stringify(localValue.artists.uniformValue) != JSON.stringify(props.meta.artists.uniformValue)},
    album: {value: localValue.album.uniformValue, isChanged: localValue.album.uniformValue != props.meta.album.uniformValue},
    year: {value: parseInt(localValue.year.uniformValue), isChanged: localValue.year.uniformValue != props.meta.year.uniformValue},
    genres: {value: localValue.genres.uniformValue, isChanged: JSON.stringify(localValue.genres.uniformValue) != JSON.stringify(props.meta.genres.uniformValue)},
  }
})
const isModified = computed(() => { 
  return Object.values(resultValue.value).some(v => v.isChanged)
})
async function editMultiValue(field: 'artists' | 'genres', values: string[], isDifferent: boolean) {
  const result = await openDialog<string[]>(EditMulti, {title: '修改', contentProps: { multiValue: values ?? [''], isDifferent: isDifferent }})
  if (result) localValue[field].uniformValue = result
}

function handleConfirm() {
  emits('confirm', {...resultValue.value})
}
</script>

<template>
  <div class=" grid grid-cols-[4rem_1fr] gap-2 items-center">
    <div class="text-right">Title</div> 
    <div>
      <input type="text" class=" placeholder:text-gray-800" v-model="localValue.title.uniformValue" :placeholder="localValue.title.isDifferent ? '**多个不同值**' : ''">
    </div>
    <div class="text-right">Artists</div>
    <div class=" flex py-2 pl-2">
      <div class=" flex-1 mr-2 text-gray-800">{{ localValue.artists.isDifferent ? '**多个不同值**' : localValue.artists.uniformValue.join(',') }}</div>
      <button @click="editMultiValue('artists', localValue.artists.uniformValue, localValue.artists.isDifferent)">...</button>
    </div>
    <div class="text-right">Album</div>
    <div>
      <input type="text" class=" placeholder:text-gray-800" v-model="localValue.album.uniformValue" :placeholder="localValue.album.isDifferent ? '**多个不同值**' : ''">
    </div>
    <div class="text-right">Year</div>
    <div>
      <input type="number" class=" placeholder:text-gray-800" v-model="localValue.year.uniformValue" :placeholder="localValue.year.isDifferent ? '**多个不同值**' : ''">
    </div>
    <div class="text-right">Genres</div>
    <div class=" flex py-2 pl-2">
      <div class=" flex-1">{{ localValue.genres.isDifferent ? '**多个不同值**' : localValue.genres.uniformValue.join(',') }}</div>
      <button @click="editMultiValue('genres', localValue.genres.uniformValue, localValue.genres.isDifferent)">...</button>
    </div>
  </div>
  <div class=" mt-4 p-1 text-right">
    <button type="button" class="  h-7 w-28 px-1 mr-2 py-0 disabled:bg-gray-500 disabled:cursor-auto" :disabled="!isModified" @click="handleConfirm">Confirm</button>
    <button type="button" class="  h-7 w-28 px-1 py-0" @click="emits('close')">Cancel</button>
  </div>
</template>

<style scoped>
@reference "tailwindcss";
input {
  @apply w-full p-2 rounded-md border border-gray-300 focus:border-cyan-500 transition-all outline-none text-gray-800
}
</style>