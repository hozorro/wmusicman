<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import { useRequest } from 'alova/client';
import { busyState, type BusyState } from '@/composables/busy'
import { getArtistArts, setArtistArts } from '@/apis/methods/manage';

// While any global task is running, setting covers is disabled
const busy = inject<BusyState | null>(busyState, null)?.busy ?? computed(() => false)

const baseURL = import.meta.env.VITE_BASE_URL;
const area = ref('Chinese')
const curArea = ref('Chinese')
const char_range = ref('A-G')
const curCharRange = ref('A-G')
const selectedArts = ref<Record<string, string>>({})
const {data: artistArts, onSuccess, send: loadArts} = useRequest((area, char_range) =>
  getArtistArts({area, char_range}),
  {
    force: true,
    immediate: false
  }
)
onSuccess(() => {
  selectedArts.value = artistArts.value.reduce((acc: Record<string, string>, cur) => {
    acc[cur.name] = ''
    return acc
  }, {})
  curArea.value = area.value
  curCharRange.value = char_range.value
})

const setResult = ref('')
function submitArts() {
  if (Object.keys(selectedArts.value).length == 0) return
  setArtistArts({
    area: area.value,
    char_range: char_range.value,
    covers: Object.entries(selectedArts.value).reduce((acc: {name: string, cover: string}[], [name, cover]) => {
      if (cover !== '')
        acc.push({name, cover})
      return acc
    }, [])
  }).then((res) => {
    console.log(res)
    setResult.value = `设置：${res.created.length}（其中无目录：${res.no_dirs.length}），存在：${res.exists.length}， 未设置：${artistArts.value.length - res.total}`
  })
}
</script>

<template>
<div class="flex flex-col gap-4">
  <div class="card">
    <div class="card-header">
      <h2>艺术家封面整理</h2>
      <span class="sp"></span>
      <span class="text-[12.5px] text-ink-3">显示所有艺术家文件夹中的封面，选择合适的，并整理到一个新的文件夹，以最终整合到音乐库。需首先用另一个工具生成艺术家图片。</span>
    </div>
    <div class="card-pad !py-3.5 flex flex-wrap items-center gap-2.5">
      <select v-model="area" class="select !w-32">
        <option value="Chinese">Chinese</option>
        <option value="Foreign">Foreign</option>
      </select>
      <select v-model="char_range" class="select !w-24">
        <option value="A-G">A-G</option>
        <option value="H-N">H-N</option>
        <option value="O-T">O-T</option>
        <option value="U-Z">U-Z</option>
        <option value="Z_">Z_</option>
      </select>
      <button type="button" class="btn" @click="loadArts(area, char_range)">查询</button>
      <button type="button" class="btn btn-primary" :disabled="busy" @click="submitArts">设置封面</button>
      <span v-if="setResult" class="text-[13px] text-ok-ink">{{ setResult }}</span>
    </div>
  </div>

  <div class="flex flex-wrap gap-3.5">
    <div v-for="item in artistArts" :key="item.name" class="card !rounded-lg overflow-hidden min-w-36">
      <div class="px-3.5 py-2 text-[13px] font-medium" :class="selectedArts[item.name] == '' ? 'bg-accent-soft text-accent' : 'bg-warn-soft text-warn-ink'">{{ item.name }}</div>
      <div class="flex flex-wrap gap-2 p-2.5">
        <img v-for="cover in item.covers" :key="cover"
          :src="baseURL + `artwork/tool/${cover}?area=${curArea}&char_range=${curCharRange}&name=${item.name}`"
          class="w-32 h-32 object-cover rounded-r cursor-pointer transition-all"
          :class="selectedArts[item.name] == cover ? 'ring-2 ring-accent' : 'opacity-60 hover:opacity-100'"
          @click="selectedArts[item.name] = selectedArts[item.name] == cover ? '' : cover"
        />
      </div>
    </div>
  </div>
</div>
</template>
