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
    proceeded: number
    success: number,
    failed: number,
    current_file: string
  }
}