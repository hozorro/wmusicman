declare interface ResponseData<T> {
  code: number,
  msg: string,
  data: T
}
declare interface ScanFolder {
  path: string,
  created_at: string,
  last_update: string
}
declare interface Artist {
  id: number,
  name: string,
}
declare interface Genre {
  id: number,
  name: string,
}
declare interface Album {
  id: number,
  title: string,
}
declare interface AlbumInfo extends Album { 
  tracks: TrackOfAlbum[]
}
declare interface ArtistInfo extends Artist { 
  main_albums: Album[],
  track_albums: Album[],
}
declare interface TrackOfAlbum {
  id: number,
  title: string,
  artists: string[],
  genres: string[],
  year: number,
  path: string,
  cover: string,
}
declare interface OutPlaylist {
  name: string,
  tracks: {
    name: string,
    artist: string,
    artists: string[],
    album: string,
    duration: string
  }[]
}