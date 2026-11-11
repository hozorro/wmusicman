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

// #region imported playlist json
declare interface PlaylistImportTrack {
  title?: string,
  artists?: string[],
  album?: string,
  path?: string
}

declare type PlaylistMatchLevel = 'path' | 'exact' | 'artist' | 'title'

declare interface PlaylistMatchCandidate {
  track_id: number,
  title: string,
  artists: string[],
  album: string,
  path: string,
  match_level: PlaylistMatchLevel
}

declare interface PlaylistTrackMatchResult {
  index: number,
  source: PlaylistImportTrack,
  match_by: 'path' | 'meta' | 'none',
  candidates: PlaylistMatchCandidate[]
}

declare interface PlaylistMatchResponse {
  total: number,
  matched_count: number,
  unmatched_count: number,
  results: PlaylistTrackMatchResult[]
}

declare interface PlaylistImportParsed {
  title: string,
  comment: string,
  username: string,
  tracks: PlaylistImportTrack[],
  filename?: string,
  hasTracks?: boolean
}

declare interface PlaylistCreateFromMatchRequest {
  title: string,
  comment: string | null,
  track_ids: number[]
}

declare interface PlaylistCreateFromMatchResponse {
  id: number,
  title: string,
  requested: number,
  added: number,
  ignored: number,
  detail?: string
}
// #endregion