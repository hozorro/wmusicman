<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  lang: 'CN' | 'FR',
  items: {id: string, title: string, artists: string[]}[],
}>()
const emits = defineEmits(['close', 'confirm', 'select'])
const playlist = ref('')

function handleConfirm() {
  emits('confirm', playlist.value.trim())
}
</script>

<template>
  <div class=" flex flex-col h-128 w-96 space-y-3">
    <div class=" flex-none">共 {{ props.items.length }} 首歌将被转移至 {{ props.lang }}</div>
    <div class=" flex-1 p-2">
      <div class=" w-full h-full overflow-y-scroll rounded-md bg-gray-200 text-sm">
        <ul>
          <li v-for="item in props.items" :title="item.id" class=" py-1">{{ item.title }} - {{ item.artists.join(', ') }}</li>
        </ul>
      </div>
    </div>
    <div class=" flex-none flex align-middle">
      <div class=" flex-none">歌单名：</div>
      <div class=" flex-1 ml-2">
        <input type="text" v-model="playlist" class=" p-2 rounded-md border border-gray-300 focus:border-cyan-500 transition-all outline-none text-gray-800" />
      </div>
    </div>
    <div class=" text-xs text-gray-500">这些文件会作为列表记录为一个json文件，后续待守护进程监测到文件并扫描到数据库后，可依据这个json文件手动创建播放列表。</div>
    <div class=" flex-none p-1 text-right">
      <button type="button" class="  h-7 w-28 px-1 mr-2 py-0 disabled:bg-gray-500 disabled:cursor-auto" @click="handleConfirm">Confirm</button>
      <button type="button" class="  h-7 w-28 px-1 py-0" @click="emits('close')">Cancel</button>
    </div>
  </div>
</template>