import type { InjectionKey, Ref } from 'vue'
import { ref } from 'vue'

export interface ScanState {
  scanInfo: Ref<ScanInfo>,
  updateScanInfo: (value: ScanInfo) => void,
  initScanState: () => void
}

export const scanInfo = ref<ScanInfo>({
  is_scanning: false,
  scan_progress: {
    total: 0,
    processed: 0,
    success: 0,
    failed: 0,
    current_file: ''
  }
})
export function updateScanInfo(value: ScanInfo) {
  scanInfo.value = value
}

export function initScanState() {
  scanInfo.value.is_scanning = false
  scanInfo.value.scan_progress = {
    total: 0,
    processed: 0,
    success: 0,
    failed: 0,
    current_file: ''
  }
}

export const scanState = Symbol() as InjectionKey<ScanState>

// Artwork state
export interface ArtworkState {
  artworkInfo: Ref<ArtworkInfo>,
  updateArtworkInfo: (value: ArtworkInfo) => void,
  initArtworkState: () => void
}

const defaultArtworkProgress: ArtworkProgress = {
  phase: '',
  phase_total: 0,
  phase_processed: 0,
  phase_generated: 0,
  phase_skipped: 0,
  phase_failed: 0,
  total_generated: 0,
  total_skipped: 0,
  total_failed: 0,
  current_item: ''
}

export const artworkInfo = ref<ArtworkInfo>({
  is_generating: false,
  artwork_progress: { ...defaultArtworkProgress }
})

export function updateArtworkInfo(value: ArtworkInfo) {
  artworkInfo.value = value
}

export function initArtworkState() {
  artworkInfo.value.is_generating = false
  artworkInfo.value.artwork_progress = { ...defaultArtworkProgress }
}

export const artworkState = Symbol() as InjectionKey<ArtworkState>