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