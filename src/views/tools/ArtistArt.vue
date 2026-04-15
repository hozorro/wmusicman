<script setup lang="ts">
import { ref } from 'vue'
import { useRequest } from 'alova/client';
import { getArtistArts, setArtistArts } from '@/apis/methods/manage';

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
<div class=" bg-white rounded-md w-full p-2">显示所有艺术家文件夹中的封面，选择合适的，并整理到一个新的文件夹，以最终整合到音乐库。需首先用另一个工具生成艺术家图片。</div>
<div class=" mt-4">
  <select v-model="area" class="  mr-2 p-1 w-28 rounded-sm border border-gray-300 focus:outline-0 focus:border-cyan-500">
    <option value="Chinese">Chinese</option>
    <option value="Foreign">Foreign</option>
  </select>
  <select v-model="char_range" class="  mr-2 p-1 w-24 rounded-sm border border-gray-300 focus:outline-0 focus:border-cyan-500">
    <option value="A-G">A-G</option>
    <option value="H-N">H-N</option>
    <option value="O-T">O-T</option>
    <option value="U-Z">U-Z</option>
    <option value="Z_">Z_</option>
  </select>
  <button @click="loadArts(area, char_range)" class=" bg-sky-600 text-white p-1 mr-4 rounded-sm">查询</button>
  <button @click="submitArts" class=" bg-sky-600 text-white p-1 mr-4 rounded-sm">设置封面</button>
  <span class=" text-green-700">{{ setResult }}</span>
</div>
<div class=" flex flex-wrap mt-3 gap-2">
  <div v-for="item in artistArts" class=" bg-white rounded-md min-w-32 overflow-hidden">
    <div class=" px-2 py-1 text-teal-50 w-full" :class="selectedArts[item.name] == '' ? ' bg-sky-500' : ' bg-amber-500'">{{ item.name }}</div>
    <div class=" flex gap-2 p-2">
      <img v-for="cover in item.covers" 
        :src="baseURL + `artwork/tool/${cover}?area=${curArea}&char_range=${curCharRange}&name=${item.name}`"
        class=" w-32 h-32 object-cover"
        :class=" {' opacity-50': selectedArts[item.name] != cover}"
        @click="selectedArts[item.name] = selectedArts[item.name] == cover ? '' : cover"
      />
    </div>
  </div>
</div>
</template>