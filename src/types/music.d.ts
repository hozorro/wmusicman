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
  cover_art_hash: string,
  tracks: TrackOfAlbum[]
}
declare interface ArtistWithCreated extends Artist { 
  created_at: string,
}
declare interface ArtistInfo extends Artist {
  face_art_hash: string,
  portrait_art_hash: string,
  main_albums: Album[],
  track_albums: Album[],
}
declare interface OrphanArtist {
  id: number,
  name: string,
  face_art_hash: string | null,
  portrait_art_hash: string | null,
}
declare interface OrphanCleanupResult {
  deleted_count: number,
  deleted_artists: { id: number, name: string }[],
  failed_ids: number[],
}
declare interface TrackOfAlbum {
  id: number,
  title: string,
  cover_art_hash: string,
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