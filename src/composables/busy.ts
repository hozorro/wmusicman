import type { ComputedRef, InjectionKey } from 'vue'

export type BusyReason = 'scan' | 'artwork' | ''

/**
 * Read-only derived state: whether a global task (library scan or artwork rebuild)
 * is running. While busy, all operation entries across pages should be disabled.
 * Provided by layout/Main.vue, derived from scanState/artworkState only.
 */
export interface BusyState {
  busy: ComputedRef<boolean>,
  busyReason: ComputedRef<BusyReason>
}

export const busyState = Symbol() as InjectionKey<BusyState>
