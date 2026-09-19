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

declare interface LogTypes {
  log_types: {label: string, value: string}[],
  log_levels: {label: string, value: string}[]
}

declare interface LogItem {
  time: string,
  level: string,
  logger: string,
  location: string,
  message: string,
}

declare interface LogPagination {
  logs: LogItem[],
  pagination: {
    total: number,
    page: number,
    page_size: number,
    total_pages: number
  }
}