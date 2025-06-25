declare interface ResponseData<T> {
  code: number,
  msg: string,
  data: T
}
declare interface ServerInfo {
  version: string,
  music_buffer: string,
  music_root: string,
  music_root_name: string,
  stats: {
    artists: number,
    albums: number,
    tracks: number,
    playlists: number,
    genres: number
  },
  status: {
    watcher: string,
    scanner: string
  }
}
declare interface TrackFile {
  path: string,
  version: string[],
  encoding: 'LATIN1' | 'UTF-8' | 'UTF-16' | 'UTF-16BE' | 'UTF-16LE' | null,
  ver_activate?: number,
  title: string,
  artist: string,
  album: string,
  year: string,
  genre: string,
  has_art: 'Y' | ''
}
declare type EditableTrackMetaField = keyof Pick<TrackFile, 'title' | 'artist' | 'album' | 'year' | 'genre'>
declare type SortableTrackMetaField = keyof Pick<TrackFile, 'title' | 'artist' | 'album' | 'year' | 'genre'>
declare interface ChangeInfo {
  encoding?: boolean,
  apev2?: boolean,
  title?: string,
  artist?: string,
  album?: string,
  year?: string,
  genre?: string,
}
declare interface ScanFolder {
  name: string,
  path: string,
  created: string,
  last_scan: string
}
declare interface Artist {
  id: string,
  name: string,
}
declare interface Album {
  id: string,
  name: string,
}
declare interface AlbumInfo extends Album { 
  tracks: Track[]
}
declare interface ArtistInfo extends Artist { 
  path: string,
  albums: Album[]
}
declare interface Track {
  id: string,
  title: string,
  artist: string,
  album: string,
  genre: string,
  year: string,
}