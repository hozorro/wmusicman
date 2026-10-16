declare interface UserDetail {
  id: number,
  username: string,
  is_admin: boolean,
  client_type?: string,
  device_id?: string,
  last_login_at?: string
}

declare interface ScanFolder {
  path: string,
  created_at: string,
  last_update: string
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

declare interface SessionInfo {
  session_id: string,
  song_count: number,
  created_at: number
}

declare interface MetaPrimary {
  album?: string;
  artists?: string[];
  genres?: string[];
  title?: string;
  year?: number;
}

declare interface MetaAddtional { 
  albumartist?: string[];
  acoustid_id?: string;
  cover_art_hash?: string;
  mb_albumartistid?: string[];
  mb_albumid?: string;
  mb_artistids?: string[];
  mb_trackid?: string; // recording id
}

declare interface SongInfo extends MetaPrimary {
  path: string;
  session: string;
  cover?: string;
}

declare interface SessionFile {
  id: string;
  ver_activate: number;
  path: string;
  file_type: string;
  encoding?: string;
  meta_id3: MetaPrimary;
  meta_apev2: MetaPrimary;
  meta_received?: MetaPrimary;
  meta_additional: MetaAddtional;
  version: string[];
  is_modified: boolean;
  cover?: string;
  use_matched_cover?: boolean;
}

type SessionFileBasic = Pick<SessionFile, 'id' | 'ver_activate' | 'path' | 'file_type' | 'encoding' | 'version' | 'cover' | 'use_matched_cover'>

declare type FileInfo = SessionFileBasic & MetaPrimary & MetaAddtional
declare type FileInfoMeta = Pick<FileInfo, 'id' | 'use_matched_cover' | keyof MetaPrimary | keyof MetaAddtional>

declare interface AcoustArtist { 
  id: string
  name: string
}

declare interface AcoustInfo {
  acoustid_id: string
  id: string // recording id
  title: string
  duration: number
  artists: AcoustArtist[]
  release_id: string
  release_title: string
  release_year: number
  release_artists: AcoustArtist[]
  release_country: string
  release_track_count: number
  score: number
}
declare interface MatchResult extends AcoustInfo { 
  use_matched_cover: boolean
}

declare interface Fingerprint {
  duration: number
  fingerprint: string
}

declare interface MetaEditInput {
  title: {uniformValue: string, isDifferent: boolean}
  artists: {uniformValue: string[], isDifferent: boolean}
  album: {uniformValue: string, isDifferent: boolean}
  year: {uniformValue: string, isDifferent: boolean} // transfer number to string, easy for type check
  genres: {uniformValue: string[], isDifferent: boolean}
}

declare interface MetaEditOutput {
  title: {value: string, isChanged: boolean}
  artists: {value: string[], isChanged: boolean}
  album: {value: string, isChanged: boolean}
  year: {value: number, isChanged: boolean}
  genres: {value: string[], isChanged: boolean}
}

declare type TransferItem = Pick<FileInfo, 'id' | 'title' | 'artists'>

// ======== Check track file before upload ==========
declare interface MusicFile {
  file_name: string  // File name
  stem: string       // File name without extension
  artists: string[]
  title: string
}

declare interface MatchedTrack {
  file: MusicFile
  db_track_id: number
  db_title: string
  db_path: string
  db_artists: string[]
  matched_artist: string
}

declare interface UnmatchedFile {
  file: MusicFile
  reason: string
}

declare interface CheckTrackFileResult {
  total: number,
  valid: number,
  matched: MatchedTrack[]
  unmatched: UnmatchedFile[]
}
