// lyric table maintenance / index init progress
declare interface LyricInitProgress {
  total: number
  processed: number
  ok: number
  pending: number
  current_file: string
}

// GET /admin/lyric/status
declare interface LyricStatusInfo {
  is_initializing: boolean
  progress: LyricInitProgress | null
  // lyric fetch status -> row count
  status: Record<string, number>
  // best extraction status -> row count
  best_status: Record<string, number>
  written: number
}

// POST /admin/lyric/import/fetch
declare interface LyricImportFetchResult {
  rows: number
  matched: number
  updated: number
  unmatched: number
  written: number
  invalid_status: number
}

// POST /admin/lyric/import/best
declare interface LyricImportBestResult {
  rows: number
  matched: number
  unmatched: number
  extracted: number
  skip: number
  no_lyric: number
  extract_failed: number
}

// GET /admin/lyric/export/best, one item of the downloaded json file
declare interface LyricBestExportItem {
  path: string
  title: string
  artists: string[]
  album: string | null
  duration: number
  lyric: string
}
