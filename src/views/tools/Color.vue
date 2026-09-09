<script setup lang="ts">
import { ref, computed } from "vue";
import useColor from "@/utils/color";

const { convertDarkColor } = useColor()
const color = ref("#FFFFFF");
const rgb = computed(() => {
  const matchResult = color.value.match(/[0-9A-F]{2}/gi);
  if (matchResult){
    return matchResult.map(item => parseInt(item, 16)) as [number,number,number];
  } else { 
    return [255,255,255] as [number,number,number];
  }
});
const darkColor = computed(() => {
  return convertDarkColor(rgb.value)
});
let extendList = Array.from(
  {length: 16-12},
  (_, i) => 12 + i
)
console.log(extendList)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="card">
      <div class="card-header"><h2>颜色计算</h2></div>
      <div class="card-pad">
        <div class="grid gap-2 grid-cols-8 mb-5">
          <div v-for="i in 16" class="rounded-r aspect-[3/1]" :style="`background-color: rgba(${i*8},0,0);`"></div>
        </div>
        <div class="flex flex-wrap gap-8 items-start">
          <div class="flex flex-col gap-3 w-56">
            <div class="input-group">
              <label>HEX</label>
              <input type="text" v-model="color" class="input" placeholder="#FFFFFF" />
            </div>
            <div class="input-group">
              <label>R</label>
              <input type="text" v-model="rgb[0]" class="input" placeholder="Red" />
            </div>
            <div class="input-group">
              <label>G</label>
              <input type="text" v-model="rgb[1]" class="input" placeholder="Green" />
            </div>
            <div class="input-group">
              <label>B</label>
              <input type="text" v-model="rgb[2]" class="input" placeholder="Blue" />
            </div>
          </div>
          <div class="flex gap-4">
            <div class="w-44 h-44 rounded-lg border border-line" :style="`background-color: ${color}`"></div>
            <div class="p-4 w-44 h-44 rounded-lg" :style="`background-color: ${darkColor}`">
              <div class="text-lg text-stone-50">雕刻时光</div>
              <div class="mt-2 text-sm text-stone-200">唯有音乐可以雕刻时光</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
