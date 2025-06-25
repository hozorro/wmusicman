import type { InjectionKey, Ref } from 'vue'

export interface ScanState {
  scanned: Ref<number>,
  updateScanned: (value: number) => void
}

export const scanState = Symbol() as InjectionKey<ScanState>