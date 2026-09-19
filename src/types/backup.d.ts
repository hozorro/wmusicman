declare interface PlaylistJson {
  title: string, 
  filename: string, 
  username: string, 
  source: string, 
  tracks: string[],
  show?: boolean
}

declare interface PlaylistBackupInfo {
  id: number, 
  title: string, 
  username: string,
  tracks: {
    title: string, 
    artists: string[]
  }[],
  show?: boolean
}

declare interface ImportResult {
  total: number,
  success: number,
  skipped: number,
  failed: number,
  errors: string[]
}