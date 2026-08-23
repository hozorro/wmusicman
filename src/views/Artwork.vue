<script setup lang="ts">
import { ref, inject, computed, watch } from 'vue'
import { type ArtworkState, artworkState } from '@/composables/key'
import { busyState, type BusyState } from '@/composables/busy'
import { startArtworkGeneration, cancelArtworkGeneration } from '@/apis/methods/manage'

const { artworkInfo, initArtworkState } = inject<ArtworkState>(artworkState) as ArtworkState
// While any global task is running, starting generation is disabled
const busy = inject<BusyState | null>(busyState, null)?.busy ?? computed(() => false)

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
  <div class="flex flex-col gap-4 animate-fade-in">
    <div class="page-head">
      <div>
        <h1>Artwork</h1>
        <p>重建歌手、专辑与曲目的 Artwork 缓存</p>
      </div>
      <div class="sp actions">
        <button
          v-if="artworkInfo.is_generating"
          type="button"
          class="btn btn-danger"
          @click="handleGenerate"
        >Stop Generating</button>
        <button
          v-else
          type="button"
          class="btn btn-primary"
          :disabled="busy || artTypes.length === 0"
          @click="handleGenerate"
        >Start Generating</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h2>选择要重建的 Artwork 类型</h2></div>
      <div class="card-pad flex flex-wrap gap-6">
        <label v-for="item in availableArtTypes" :key="item.value" class="check">
          <input
            type="checkbox"
            :checked="artTypes.includes(item.value)"
            @change="toggleArtType(item.value)"
            :disabled="artworkInfo.is_generating || busy"
          />
          <span>{{ item.label }}</span>
        </label>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2>Artwork Progress</h2>
        <span class="sp"></span>
        <span v-if="artworkInfo.is_generating" class="tag tag-cyan animate-soft-pulse">正在重建 artwork 缓存...</span>
      </div>

      <div v-if="artworkInfo.is_generating" class="card-pad flex flex-col gap-4">
        <!-- Phase info -->
        <div class="text-[13.5px] text-ink-2">
          当前阶段: <span class="font-semibold text-ink-1">{{ artworkInfo.artwork_progress.phase || '准备中...' }}</span>
        </div>

        <!-- Phase progress bar -->
        <div class="flex items-center gap-3">
          <div class="progress progress-lg progress-striped flex-1">
            <div class="bar" :style="{ width: phaseProgress + '%' }"></div>
          </div>
          <span class="w-16 text-right text-[13px] font-semibold text-ink-2 num">{{ phaseProgress }}%</span>
        </div>

        <!-- Phase stats -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <div class="kpi">
            <div class="kpi-k">Phase Total</div>
            <div class="kpi-v !text-xl">{{ artworkInfo.artwork_progress.phase_total }}</div>
          </div>
          <div class="kpi">
            <div class="kpi-k">Phase Processed</div>
            <div class="kpi-v !text-xl">{{ artworkInfo.artwork_progress.phase_processed }}</div>
          </div>
          <div class="kpi">
            <div class="kpi-k text-ok-ink">Generated</div>
            <div class="kpi-v !text-xl text-ok">{{ artworkInfo.artwork_progress.phase_generated }}</div>
          </div>
          <div class="kpi">
            <div class="kpi-k">Skipped</div>
            <div class="kpi-v !text-xl text-ink-3">{{ artworkInfo.artwork_progress.phase_skipped }}</div>
          </div>
          <div class="kpi">
            <div class="kpi-k text-bad-ink">Failed</div>
            <div class="kpi-v !text-xl text-bad">{{ artworkInfo.artwork_progress.phase_failed }}</div>
          </div>
        </div>

        <!-- Current item -->
        <div v-if="artworkInfo.artwork_progress.current_item" class="text-[12.5px] text-ink-3 truncate">
          当前处理: <span class="text-ink-2">{{ artworkInfo.artwork_progress.current_item }}</span>
        </div>

        <!-- Total stats -->
        <div class="grid grid-cols-3 gap-3.5 border-t border-line pt-4">
          <div class="kpi text-center">
            <div class="kpi-v justify-center !text-2xl text-ok">{{ artworkInfo.artwork_progress.total_generated }}</div>
            <div class="kpi-k justify-center mt-1">Generated</div>
          </div>
          <div class="kpi text-center">
            <div class="kpi-v justify-center !text-2xl text-ink-3">{{ artworkInfo.artwork_progress.total_skipped }}</div>
            <div class="kpi-k justify-center mt-1">Skipped</div>
          </div>
          <div class="kpi text-center">
            <div class="kpi-v justify-center !text-2xl text-bad">{{ artworkInfo.artwork_progress.total_failed }}</div>
            <div class="kpi-k justify-center mt-1">Failed</div>
          </div>
        </div>
      </div>

      <div v-else-if="lastProgress" class="card-pad">
        <div class="text-[14px] font-semibold text-ink-1 mb-3">重建完成 - 总计统计</div>
        <div class="grid grid-cols-3 gap-3.5">
          <div class="kpi text-center">
            <div class="kpi-v justify-center !text-2xl text-ok">{{ lastProgress.total_generated }}</div>
            <div class="kpi-k justify-center mt-1">Generated</div>
          </div>
          <div class="kpi text-center">
            <div class="kpi-v justify-center !text-2xl text-ink-3">{{ lastProgress.total_skipped }}</div>
            <div class="kpi-k justify-center mt-1">Skipped</div>
          </div>
          <div class="kpi text-center">
            <div class="kpi-v justify-center !text-2xl text-bad">{{ lastProgress.total_failed }}</div>
            <div class="kpi-k justify-center mt-1">Failed</div>
          </div>
        </div>
      </div>

      <div v-else class="state-box !py-10">无重建进度</div>
    </div>
  </div>
</template>
