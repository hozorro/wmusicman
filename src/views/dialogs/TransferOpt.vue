<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import { busyState, type BusyState } from '@/composables/busy'

// While any global task is running, submit is disabled (read-only)
const busy = inject<BusyState | null>(busyState, null)?.busy ?? computed(() => false)

const props = defineProps<{
  lang: 'CN' | 'FR',
  items: {id: string, title: string, artists: string[]}[],
}>()
const emits = defineEmits(['close', 'confirm', 'select'])
const playlist = ref('')
const isUseOriginalName = ref(false)

function handleConfirm() {
  emits('confirm', { playlist: playlist.value.trim(), isUseOriginalName: isUseOriginalName.value })
}
</script>

<template>
  <div class="flex flex-col h-128 w-96 gap-3">
    <div class="flex-none text-[13.5px] text-ink-2">
      共 <b class="text-ink-1 num">{{ props.items.length }}</b> 首歌将被转移至 <span class="tag tag-info">{{ props.lang }}</span><br />
      <span class="font-bold animate-pulse" 
        :class="{'text-emerald-700 bg-emerald-100/50': props.lang === 'CN', 'text-bad bg-bad-soft/50': props.lang === 'FR'}">
        请再次确认转移的区域！当前为：{{ props.lang }}
      </span>
    </div>
    <div class=" flex-none text-[13px] text-ink-3 flex gap-2 items-center">
      <input type="checkbox" id="isUseOriginalName" v-model="isUseOriginalName">
      <label for="isUseOriginalName">使用原文件名(一般用于覆盖同名文件，会去除hash前缀)</label>
    </div>
    <div class="flex-1 min-h-0 overflow-y-auto rounded-r bg-panel border border-line px-3.5 py-2.5">
      <ul class="text-[13px] text-ink-2">
        <li v-for="item in props.items" :key="item.id" :title="item.id" class="py-1 truncate">{{ item.artists.join(', ') }} - {{ item.title }}</li>
      </ul>
    </div>
    <div class="flex-none flex items-center gap-2">
      <label class="flex-none text-[13px] text-ink-3">歌单名：</label>
      <input type="text" v-model="playlist" class="input flex-1" :disabled="busy" />
    </div>
    <div class="text-[12px] text-ink-3 leading-relaxed">如歌单名不为空，这些歌曲会作为列表记录为一个json文件，后续可依据这个json文件创建播放列表。</div>
    <div class="flex-none flex justify-end gap-2">
      <button type="button" class="btn" @click="emits('close')">Cancel</button>
      <button type="button" class="btn btn-primary" :disabled="busy" @click="handleConfirm">Confirm</button>
    </div>
  </div>
</template>
