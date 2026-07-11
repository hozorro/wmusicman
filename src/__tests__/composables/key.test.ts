import { describe, it, expect, beforeEach } from 'vitest'
import {
  scanInfo,
  updateScanInfo,
  initScanState,
  artworkInfo,
  updateArtworkInfo,
  initArtworkState
} from '@/composables/key'

describe('scanState', () => {
  beforeEach(() => {
    initScanState()
  })

  describe('scanInfo initial state', () => {
    it('should have is_scanning as false', () => {
      expect(scanInfo.value.is_scanning).toBe(false)
    })

    it('should have correct initial scan_progress', () => {
      expect(scanInfo.value.scan_progress).toEqual({
        total: 0,
        processed: 0,
        success: 0,
        failed: 0,
        current_file: ''
      })
    })
  })

  describe('updateScanInfo', () => {
    it('should update scan info', () => {
      const newInfo: ScanInfo = {
        is_scanning: true,
        scan_progress: {
          total: 100,
          processed: 50,
          success: 45,
          failed: 5,
          current_file: '/music/test.mp3'
        }
      }
      updateScanInfo(newInfo)
      expect(scanInfo.value).toEqual(newInfo)
    })

    it('should update is_scanning flag', () => {
      updateScanInfo({
        is_scanning: true,
        scan_progress: {
          total: 0,
          processed: 0,
          success: 0,
          failed: 0,
          current_file: ''
        }
      })
      expect(scanInfo.value.is_scanning).toBe(true)
    })
  })

  describe('initScanState', () => {
    it('should reset to initial state', () => {
      // First modify the state
      updateScanInfo({
        is_scanning: true,
        scan_progress: {
          total: 100,
          processed: 50,
          success: 45,
          failed: 5,
          current_file: '/music/test.mp3'
        }
      })
      
      // Then reset
      initScanState()
      
      expect(scanInfo.value.is_scanning).toBe(false)
      expect(scanInfo.value.scan_progress.total).toBe(0)
      expect(scanInfo.value.scan_progress.processed).toBe(0)
      expect(scanInfo.value.scan_progress.success).toBe(0)
      expect(scanInfo.value.scan_progress.failed).toBe(0)
      expect(scanInfo.value.scan_progress.current_file).toBe('')
    })
  })
})

describe('artworkState', () => {
  beforeEach(() => {
    initArtworkState()
  })

  describe('artworkInfo initial state', () => {
    it('should have is_generating as false', () => {
      expect(artworkInfo.value.is_generating).toBe(false)
    })

    it('should have correct initial artwork_progress', () => {
      expect(artworkInfo.value.artwork_progress).toEqual({
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
      })
    })
  })

  describe('updateArtworkInfo', () => {
    it('should update artwork info', () => {
      const newInfo: ArtworkInfo = {
        is_generating: true,
        artwork_progress: {
          phase: 'artist_face',
          phase_total: 100,
          phase_processed: 50,
          phase_generated: 40,
          phase_skipped: 5,
          phase_failed: 5,
          total_generated: 40,
          total_skipped: 5,
          total_failed: 5,
          current_item: '123:Artist Name'
        }
      }
      updateArtworkInfo(newInfo)
      expect(artworkInfo.value).toEqual(newInfo)
    })

    it('should update is_generating flag', () => {
      updateArtworkInfo({
        is_generating: true,
        artwork_progress: {
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
      })
      expect(artworkInfo.value.is_generating).toBe(true)
    })
  })

  describe('initArtworkState', () => {
    it('should reset to initial state', () => {
      // First modify the state
      updateArtworkInfo({
        is_generating: true,
        artwork_progress: {
          phase: 'artist_face',
          phase_total: 100,
          phase_processed: 50,
          phase_generated: 40,
          phase_skipped: 5,
          phase_failed: 5,
          total_generated: 40,
          total_skipped: 5,
          total_failed: 5,
          current_item: '123:Artist Name'
        }
      })
      
      // Then reset
      initArtworkState()
      
      expect(artworkInfo.value.is_generating).toBe(false)
      expect(artworkInfo.value.artwork_progress.phase).toBe('')
      expect(artworkInfo.value.artwork_progress.phase_total).toBe(0)
      expect(artworkInfo.value.artwork_progress.phase_processed).toBe(0)
      expect(artworkInfo.value.artwork_progress.phase_generated).toBe(0)
      expect(artworkInfo.value.artwork_progress.phase_skipped).toBe(0)
      expect(artworkInfo.value.artwork_progress.phase_failed).toBe(0)
      expect(artworkInfo.value.artwork_progress.total_generated).toBe(0)
      expect(artworkInfo.value.artwork_progress.total_skipped).toBe(0)
      expect(artworkInfo.value.artwork_progress.total_failed).toBe(0)
      expect(artworkInfo.value.artwork_progress.current_item).toBe('')
    })
  })
})
