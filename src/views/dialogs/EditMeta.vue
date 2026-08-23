<script setup lang="ts">
import { computed, reactive, inject } from 'vue';
import { busyState, type BusyState } from '@/composables/busy'
import { openDialog } from '@/composables/wdialog';
import EditMulti from './EditMulti.vue';

// While any global task is running, submit is disabled (read-only)
const busy = inject<BusyState | null>(busyState, null)?.busy ?? computed(() => false)

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
  <div class="grid grid-cols-[4.5rem_1fr] gap-x-4 gap-y-3 items-center">
    <div class="text-right text-[13px] text-ink-3">Title</div> 
    <div>
      <input type="text" class="input w-full" v-model="localValue.title.uniformValue" :placeholder="localValue.title.isDifferent ? '**多个不同值**' : ''" :disabled="busy">
    </div>
    <div class="text-right text-[13px] text-ink-3">Artists</div>
    <div class="flex items-center gap-2">
      <div class="input flex-1 !bg-panel !cursor-default truncate">{{ localValue.artists.isDifferent ? '**多个不同值**' : localValue.artists.uniformValue.join(',') }}</div>
      <button type="button" class="btn btn-ghost btn-sm flex-none" :disabled="busy" @click="editMultiValue('artists', localValue.artists.uniformValue, localValue.artists.isDifferent)">编辑</button>
    </div>
    <div class="text-right text-[13px] text-ink-3">Album</div>
    <div>
      <input type="text" class="input w-full" v-model="localValue.album.uniformValue" :placeholder="localValue.album.isDifferent ? '**多个不同值**' : ''" :disabled="busy">
    </div>
    <div class="text-right text-[13px] text-ink-3">Year</div>
    <div>
      <input type="number" class="input w-full" v-model="localValue.year.uniformValue" :placeholder="localValue.year.isDifferent ? '**多个不同值**' : ''" :disabled="busy">
    </div>
    <div class="text-right text-[13px] text-ink-3">Genres</div>
    <div class="flex items-center gap-2">
      <div class="input flex-1 !bg-panel !cursor-default truncate">{{ localValue.genres.isDifferent ? '**多个不同值**' : localValue.genres.uniformValue.join(',') }}</div>
      <button type="button" class="btn btn-ghost btn-sm flex-none" :disabled="busy" @click="editMultiValue('genres', localValue.genres.uniformValue, localValue.genres.isDifferent)">编辑</button>
    </div>
  </div>
  <div class="mt-5 flex justify-end gap-2">
    <button type="button" class="btn" @click="emits('close')">Cancel</button>
    <button type="button" class="btn btn-primary" :disabled="busy || !isModified" @click="handleConfirm">Confirm</button>
  </div>
</template>