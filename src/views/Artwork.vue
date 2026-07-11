<script setup lang="ts">
import { ref, inject, computed, watch } from 'vue'
import { type ArtworkState, artworkState } from '@/composables/key'
import { startArtworkGeneration, cancelArtworkGeneration } from '@/apis/methods/manage'

const { artworkInfo, initArtworkState } = inject<ArtworkState>(artworkState) as ArtworkState

// Save final progress info when generation completes
const lastProgress = ref<ArtworkProgress | null>(null)

// Art types selection
const artTypes = ref<string[]>(['artist', 'album', 'track'])
const availableArtTypes = [
  { value: 'artist', label: 'Artist (Face & Portrait)' },
  { value: 'album', label: 'Album (Cover)' },
  { value: 'track', label: 'Track (Cover)' }
]

function toggleArtType(type: string) {
  const index = artTypes.value.indexOf(type)
  if (index === -1) {
    artTypes.value.push(type)
  } else {
    artTypes.value.splice(index, 1)
  }
}

async function handleGenerate() {
  if (artworkInfo.value.is_generating) {
    // Save current progress before clearing
    lastProgress.value = { ...artworkInfo.value.artwork_progress }
    await cancelArtworkGeneration()
    initArtworkState()
  } else {
    lastProgress.value = null
    initArtworkState()
    const types = artTypes.value.length === 3 ? null : artTypes.value
    await startArtworkGeneration(types)
    artworkInfo.value.is_generating = true
  }
}

// Continuously save progress whenever it contains meaningful data.
// This ensures lastProgress always holds the latest stats before backend resets.
watch(() => artworkInfo.value.artwork_progress, (p) => {
  if (p && (p.total_generated > 0 || p.total_skipped > 0 || p.total_failed > 0 || p.phase_total > 0)) {
    lastProgress.value = { ...p }
  }
}, { deep: true })

// Progress calculations
const phaseProgress = computed(() => {
  const p = artworkInfo.value.artwork_progress
  if (p.phase_total === 0) return 0
  return (p.phase_processed / p.phase_total * 100).toFixed(2)
})

</script>

<template>
  <div class="my-2">
    <div class="mb-4">
      <div class="text-lg font-bold mb-2">选择要重建的 Artwork 类型</div>
      <div class="flex gap-4">
        <label v-for="item in availableArtTypes" :key="item.value" class="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            :checked="artTypes.includes(item.value)" 
            @change="toggleArtType(item.value)"
            :disabled="artworkInfo.is_generating"
            class="w-4 h-4"
          />
          <span>{{ item.label }}</span>
        </label>
      </div>
    </div>
    <button 
      type="button" 
      class="p-2 w-40" 
      :disabled="!artworkInfo.is_generating && artTypes.length === 0"
      @click="handleGenerate"
    >
      {{ artworkInfo.is_generating ? 'Stop Generating' : 'Start Generating' }}
    </button>
    <span v-if="artworkInfo.is_generating" class="ml-2 text-gray-600 text-sm">
      正在重建 artwork 缓存...
    </span>
  </div>
  
  <hr class="my-2 text-gray-300" />
  
  <div class="my-1 text-xl font-bold">Artwork Progress</div>
  
  <div v-if="artworkInfo.is_generating">
    <!-- Phase info -->
    <div class="mt-2 p-2 bg-blue-50 rounded-md">
      <div class="text-sm font-medium text-blue-800">
        当前阶段: <span class="font-bold">{{ artworkInfo.artwork_progress.phase || '准备中...' }}</span>
      </div>
    </div>
    
    <!-- Phase progress bar -->
    <div class="relative mt-2 w-full h-8 bg-gray-300 text-cyan-700 rounded-md">
      <div 
        class="absolute top-0 left-0 p-1 h-full bg-cyan-300/50 rounded-md overflow-hidden text-center transition-all"
        :style="{width: `${phaseProgress}%`}"
      >
        {{ phaseProgress }}%
      </div>
    </div>
    
    <!-- Phase stats -->
    <div class="mt-2 p-2 grid grid-cols-[8rem_1fr] gap-y-1">
      <div class="font-medium">Phase Total:</div>
      <div>{{ artworkInfo.artwork_progress.phase_total }}</div>
      <div class="font-medium">Phase Processed:</div>
      <div>{{ artworkInfo.artwork_progress.phase_processed }}</div>
      <div class="font-medium text-green-600">Generated:</div>
      <div class="text-green-600">{{ artworkInfo.artwork_progress.phase_generated }}</div>
      <div class="font-medium text-gray-500">Skipped:</div>
      <div class="text-gray-500">{{ artworkInfo.artwork_progress.phase_skipped }}</div>
      <div class="font-medium text-red-600">Failed:</div>
      <div class="text-red-600">{{ artworkInfo.artwork_progress.phase_failed }}</div>
    </div>
    
    <!-- Current item -->
    <div v-if="artworkInfo.artwork_progress.current_item" class="mt-2 p-2 bg-gray-50 rounded-md text-sm">
      <span class="font-medium">当前处理:</span> 
      <span class="text-gray-600">{{ artworkInfo.artwork_progress.current_item }}</span>
    </div>
    
    <!-- Total stats -->
    <div class="mt-4 p-3 bg-green-50 rounded-md border border-green-200">
      <div class="font-bold text-green-800 mb-2">总计统计</div>
      <div class="grid grid-cols-3 gap-4 text-center">
        <div>
          <div class="text-2xl font-bold text-green-600">{{ artworkInfo.artwork_progress.total_generated }}</div>
          <div class="text-sm text-gray-600">Generated</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-gray-500">{{ artworkInfo.artwork_progress.total_skipped }}</div>
          <div class="text-sm text-gray-600">Skipped</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-red-600">{{ artworkInfo.artwork_progress.total_failed }}</div>
          <div class="text-sm text-gray-600">Failed</div>
        </div>
      </div>
    </div>
  </div>
  
  <div v-else-if="lastProgress" class="mt-2 p-3 bg-green-50 rounded-md border border-green-200">
    <div class="font-bold text-green-800 mb-2">重建完成 - 总计统计</div>
    <div class="grid grid-cols-3 gap-4 text-center">
      <div>
        <div class="text-2xl font-bold text-green-600">{{ lastProgress.total_generated }}</div>
        <div class="text-sm text-gray-600">Generated</div>
      </div>
      <div>
        <div class="text-2xl font-bold text-gray-500">{{ lastProgress.total_skipped }}</div>
        <div class="text-sm text-gray-600">Skipped</div>
      </div>
      <div>
        <div class="text-2xl font-bold text-red-600">{{ lastProgress.total_failed }}</div>
        <div class="text-sm text-gray-600">Failed</div>
      </div>
    </div>
  </div>
  
  <div v-else class="mt-2 p-4 text-center text-gray-500 bg-gray-50 rounded-md">
    无重建进度
  </div>
</template>
