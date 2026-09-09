<script setup lang="ts">
import { computed, inject } from 'vue'
import { scanState, type ScanState, artworkState, type ArtworkState } from '@/composables/key'

// Read-only consumption: the SSE connections live in layout/Main.vue,
// this bar only displays the current active task progress.
const { scanInfo } = inject<ScanState>(scanState) as ScanState
const { artworkInfo } = inject<ArtworkState>(artworkState) as ArtworkState

// Scan takes priority; the two tasks are mutually exclusive so only one shows at a time.
const mode = computed<'scan' | 'artwork' | ''>(() => {
  if (scanInfo.value.is_scanning) return 'scan'
  if (artworkInfo.value.is_generating) return 'artwork'
  return ''
})
const visible = computed(() => mode.value !== '')

const scanProgress = computed(() => scanInfo.value.scan_progress)
const scanPct = computed(() => {
  const p = scanProgress.value
  return p.total > 0 ? Math.min(100, Math.round((p.processed / p.total) * 100)) : 0
})

const artProgress = computed(() => artworkInfo.value.artwork_progress)
const artPct = computed(() => {
  const p = artProgress.value
  return p && p.phase_total > 0 ? Math.min(100, Math.round((p.phase_processed / p.phase_total) * 100)) : 0
})
</script>

<template>
  <div class="status-bar" :class="{ hidden: !visible }" aria-live="polite">
    <div class="st-icon">
      <!-- spinner -->
      <svg width="15" height="15" viewBox="0 0 256 256" fill="currentColor">
        <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm8-88V72a8,8,0,0,0-16,0v64a8,8,0,0,0,16,0Zm45.66,37.66a8,8,0,0,1-11.32,11.32l-32-32a8,8,0,0,1,0-11.31l32-32a8,8,0,0,1,11.32,11.31L156.69,128Z"/>
      </svg>
    </div>
    <div class="st-info">
      <template v-if="mode === 'scan'">
        <div class="st-title">
          Library Scan
          <span class="file">{{ scanProgress.current_file }}</span>
        </div>
        <div class="st-progress">
          <div class="progress progress-striped">
            <div class="bar" :style="{ width: scanPct + '%' }"></div>
          </div>
          <span class="pct">{{ scanPct }}%</span>
        </div>
      </template>
      <template v-else-if="mode === 'artwork'">
        <div class="st-title">
          Artwork Rebuild<template v-if="artProgress?.phase"> · {{ artProgress.phase }}</template>
          <span class="file">{{ artProgress?.current_item }}</span>
        </div>
        <div class="st-progress">
          <div class="progress progress-striped">
            <div class="bar" :style="{ width: artPct + '%' }"></div>
          </div>
          <span class="pct">{{ artPct }}%</span>
        </div>
      </template>
    </div>
    <div v-if="mode === 'scan'" class="st-stats">
      <span class="num">{{ scanProgress.processed }}/{{ scanProgress.total }}</span>
      <span class="text-ok-ink">OK {{ scanProgress.success }}</span>
      <span class="text-bad-ink">Fail {{ scanProgress.failed }}</span>
    </div>
    <div v-else-if="mode === 'artwork' && artProgress" class="st-stats">
      <span class="num">{{ artProgress.phase_processed }}/{{ artProgress.phase_total }}</span>
      <span class="text-ok-ink">Gen {{ artProgress.total_generated }}</span>
      <span>Skip {{ artProgress.total_skipped }}</span>
      <span class="text-bad-ink">Fail {{ artProgress.total_failed }}</span>
    </div>
  </div>
</template>

<style scoped>
/* The bar lives inside the main column, so it spans from its left edge */
.status-bar { left: 0; }
.st-stats { display: flex; align-items: center; gap: 12px; }
</style>
