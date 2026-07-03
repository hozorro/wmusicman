declare type rgbColor = [
  red: number,
  green: number,
  blue: number,
]

declare interface AnalysColors {
  corners: rgbColor[],
  center: rgbColor,
  dominant: rgbColor,
  secondDominant: rgbColor,
  average: rgbColor
}

declare interface ScanInfo {
  is_scanning: boolean,
  scan_progress: {
    total: number,
    processed: number
    success: number,
    failed: number,
    current_file: string
  }
}

declare interface ArtworkProgress {
  phase: string,
  phase_total: number,
  phase_processed: number,
  phase_generated: number,
  phase_skipped: number,
  phase_failed: number,
  total_generated: number,
  total_skipped: number,
  total_failed: number,
  current_item: string
}

declare interface ArtworkInfo {
  is_generating: boolean,
  artwork_progress: ArtworkProgress
}