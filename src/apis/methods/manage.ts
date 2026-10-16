import { generalAlova, downloadAlova } from "@/apis";
import { TokenStorage } from "@/utils/auth";

// const baseSrcURL = import.meta.env.VITE_BASE_SRC_URL;
const baseURL = import.meta.env.VITE_BASE_URL;

export const transformArtwork = (artType: 'track' | 'album' | 'artist', id: number, refresh: boolean = false, imgType?: string) => {
  let url = '';
  let hash = refresh ? Date.now().toString() : '';
  if (artType === 'artist') {
    url = baseURL + `artwork/artist/${id}?img_cate=${imgType}${hash ? `&hashed=${hash}` : ''}`
  } else {
    url = baseURL + `artwork/${artType}/${id}${hash ? `?hashed=${hash}` : ''}`
  }
  return url;
}

export const login = (username: string, password: string) => { 
  const method = generalAlova.Post<TokenData>('/auth/login', {
    username,
    password,
    device_id: TokenStorage.getDeviceId(),
  })
  method.meta = { authRole: 'login' }
  return method;
}
export const logout = (allDevice: boolean) => { 
  const method = generalAlova.Post<string>(`/auth/logout${allDevice ? '?all=true' : ''}`);
  method.meta = { authRole: 'logout' }
  return method;
}
export const refreshToken = (refresh_token: string) => {
  const method = generalAlova.Post<TokenData>('/auth/refresh', {refresh_token})
  method.meta = { authRole: 'refreshToken' }
  return method;
}
export const register = (username: string, password: string, is_admin: boolean) => { 
  const method = generalAlova.Post<string>("/auth/register", {username, password, is_admin});
  method.meta = { authRole: null }
  return method;
}
export const getCurrentUser = () => { 
  return generalAlova.Get<UserInfo>("/auth/me");
}

// #region initial
export const getInitDirs = () => { 
  return generalAlova.Get<{name: string, path: string}[]>("/admin/sysinfo/initdirs", { hitSource: ['create-init-dirs'] });
}
export const createInitDirs = () => { 
  return generalAlova.Post("/admin/sysinfo/initdirs", {}, {
    name: 'create-init-dirs'
  });
}
export const uploadDefautArt = (formData: FormData) => {
  return generalAlova.Post(`/artwork/default`, formData, { 
    name: 'upload-default-art',
  });
}
// #endregion

// #region Index
export const checkInitialized = () => { 
  const method = generalAlova.Get<{'initialized': boolean}>("/system/initialized");
  method.meta = { authRole: null }
  return method;
}
export const getScanInfo = () => {
  return generalAlova.Get<ScanInfo>("/admin/sysinfo/scaninfo");
}
export const getServerInfo = () => {
  return generalAlova.Get<any>("/admin/sysinfo/stats", { 
    hitSource: [
      'transfer-files',
      'start-watcher',
      'stop-watcher',
      'startScan',
      'stopScan'
    ] 
  });
}
export const initializeMeta = () => { 
  return generalAlova.Post("/admin/sysinfo/initializemeta");
}
export const startWatcher = () => { 
  return generalAlova.Post<string>("/admin/scan/startwatcher", {}, {
    name: 'start-watcher',
  });
}
export const stopWatcher = () => { 
  return generalAlova.Post<string>("/admin/scan/stopwatcher", {}, {
    name: 'stop-watcher',
  });
}
// #endregion

// #region upload and transfer(stagging)
export const uploadFile = (file: File, name: string) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("name", name);
  return generalAlova.Post("/admin/upload/uploadfile", formData, { 
    name: 'upload-file',
  });
}
export const createStageSession = () => { 
  return generalAlova.Post<{session_id: string}>("/admin/upload/staging/session", {}, {
    name: 'create-session'
  });
}
export const getStageSessions = () => { 
  return generalAlova.Get<{sessions: SessionInfo[]}>("/admin/upload/staging/sessions", 
    { hitSource: ['transfer-files', 'create-session', 'upload', 'add-files-to-session'] }
  );
}
export const addFilesToSession = (session_id: string) => {
  return generalAlova.Post("/admin/upload/staging/sessions/" + session_id + "/files",  {}, {
    name: 'add-files-to-session',
    transform: (res: SessionFile[]) => {
      return res.map((item) => {
          return {
            ...item,
            ver_activate: 0,
            id: item.path,
            is_modified: false,
            cover: baseURL + `artwork/tmp/track/${item.path}?session_id=${session_id}`
          }
      })
    }
  })
}
export const getSessionFiles = (session_id: string) => {
  return generalAlova.Get("/admin/upload/staging/sessions/" + session_id + "/files",{
    transform: (res: SessionFile[]) => {
      return res.map((item) => {
        return {
          ...item,
          ver_activate: 0,
          id: item.path,
          is_modified: false,
          cover: baseURL + `artwork/tmp/track/${item.path}?session_id=${session_id}`
        }
      })
    },
    hitSource: [
      'add-files-to-session',
      'update-meta-version',
      'update-meta-tags'
    ]
  });
}
export const generateFingerprint = (filename: string, session_id: string) => {
  return generalAlova.Post<Fingerprint>("/admin/upload/staging/sessions/fingerprint", { filename, session_id }, {cacheFor: 1000 * 60 * 5});
}
export const matchFingerprint = (duration: number, fingerprint: string) => {
  return generalAlova.Post<{matched_list: AcoustInfo[]}>("/admin/upload/staging/sessions/match", { duration, fingerprint }, {cacheFor: 1000 * 60 * 5});
}
// export const switchVersionType = (path: string, ver_type: string) => {
//   return generalAlova.Post<ResponseData<TrackFile>>("/switchversiontype", { path, ver_type });
// }
export const updateMetaVersion = (session_id: string, items: {id: string, use_apev2: boolean}[]) => { 
  return generalAlova.Post<{count: number}>(`/admin/upload/staging/sessions/${session_id}/updateversion`, {items}, {name: 'update-meta-version'});
}
export const updateMetaTags = (session_id: string, items: FileInfoMeta[]) => { 
  return generalAlova.Post<{count: number}>(`/admin/upload/staging/sessions/${session_id}/updatemetatags`, 
    {
      batch_count: items.length,
      items
    }, 
    {name: 'update-meta-tags'}
  );
}
// export const updateFieldTag = (items: string[], field: keyof TrackFile, value: string) => { 
//   return generalAlova.Post<ResponseData<string>>("/updatefieldtag", {items, field, value});
// }
export const transferFiles = (items: string[], lang: string, session_id: string, isUseOriginalName: boolean, playlist: string) => { 
  return generalAlova.Post<{count: number}>(`/admin/upload/staging/sessions/${session_id}/archive?lang=${lang}`,
    { items, playlist, is_use_original_name: isUseOriginalName },
    { name: "transfer-files", timeout: 1000 * 60 * 10 }
  );
}
export const deleteFilesFromSession = (session_id: string, items: string[]) => {
  return generalAlova.Post<{count: number}>(`/admin/upload/staging/sessions/${session_id}/deletefiles`,
    { items },
    { name: 'delete-files-from-session' }
  );
}
// #endregion

// #region  Edit
export const getArtistChars = () => { 
  return generalAlova.Get("/admin/edit/getartistchars",{
    transform: (res: [string, boolean][]) => {
      return res.map(item => ({
        charName: item[0], 
        hasArtist: item[1],
      }));
    }
  });
}
export const getArtists = (achar: string) => { 
  return generalAlova.Get<Artist[]>("/admin/edit/getartists/" + achar);
}
// 按创建时间分页获取歌手列表（由新到老）
export const getArtistsByPage = (page: number, pageSize: number) => {
  return generalAlova.Get<{list: ArtistWithCreated[], total: number}>("/admin/edit/getartistsbypage", {
    params: { page, page_size: pageSize }
  });
}
export const getArtist = (id: number) => { 
  return generalAlova.Get("/admin/edit/artist/" + id, {
    transform: (res: ArtistInfo) => {
      return {
        ...res,
        face: res.face_art_hash ? baseURL + `artwork/artist/${res.id}?img_cate=face&h=${res.face_art_hash}` : '',
        portrait: res.portrait_art_hash ? baseURL + `artwork/artist/${res.id}?img_cate=portrait&h=${res.portrait_art_hash}` : '',
      };
    }
  });
}
export const getAlbum = (id: number) => { 
  return generalAlova.Get("/admin/edit/album/" + id, {
    transform: (res: AlbumInfo) => {
      return {
        ...res,
        cover: res.cover_art_hash ? baseURL + `artwork/album/${res.id}?h=${res.cover_art_hash}` : '',
        tracks: res.tracks.map(item => ({
          ...item,
          cover: item.cover_art_hash ? baseURL + `artwork/track/${item.id}?h=${item.cover_art_hash}` : '',
        })),
      };
    }
  });
}
export const uploadArtistArt = (formData: FormData) => {
  return generalAlova.Post('/admin/edit/uploadartistart', formData, {
    shareRequest: false,
    transform: (res: {id: number, art_type: string}) => {
      return baseURL + `artwork/artist/${res.id}?img_cate=${res.art_type}`
    }
  });
}
export const uploadAlbumArt = (formData: FormData) => {
  return generalAlova.Post('/admin/edit/uploadalbumart', formData, {
    shareRequest: false,
    transform: (res: number) => {
      return baseURL + `artwork/album/${res}`
    }
  });
}
// 获取 artist 候选图片列表
export const getArtistArtCandidates = (artist_id: number, art_type: 'face' | 'portrait') => {
  return generalAlova.Get<{artist_dir: string | null, candidates: string[]}>(
    `/admin/edit/artistartcandidates/${artist_id}`, 
    { 
      params: { art_type }, 
      shareRequest: false,
      name: 'get-artist-art-candidates'
    }
  );
}
export const createArtistDir = (artist_name: string, lang: 'CN' | 'FR') => {
  return generalAlova.Post<string>(
    '/admin/edit/createartistdir', 
    { artist_name, lang },
    { meta: { errorDisplay: 'page' }}
  );
}
// 上传候选图片到 artist 目录（自动编号）
export const uploadArtistArtCandidate = (formData: FormData) => {
  return generalAlova.Post<{filename: string}>(
    '/admin/edit/uploadartistartcandidate', 
    formData, 
    { shareRequest: false }
  );
}
// 从候选中设置正式 artwork
export const setArtistArt = (artist_id: number, art_type: 'face' | 'portrait', filename: string) => {
  return generalAlova.Post<string>(
    '/admin/edit/setartistart', 
    { artist_id, art_type, filename }
  );
}
export const updateTrackFieldTag = (items: number[], field: keyof TrackOfAlbum, value: string | number | string[]) => { 
  return generalAlova.Post<string>("/admin/edit/updatetrackfieldtag", {items, field, value});
}
// 修改曲目封面：上传图片文件，后端将其写入对应歌曲文件的 cover
// formData 需包含: file (图片文件), track_id (曲目ID)
export const updateTrackCover = (formData: FormData) => {
  return generalAlova.Post('/admin/edit/updatetrackcover', formData, {
    shareRequest: false,
    transform: (res: number) => {
      return baseURL + `artwork/track/${res}`
    }
  });
}

// 获取孤儿歌手列表
export const getOrphanArtists = () => {
  return generalAlova.Get<OrphanArtist[]>('/admin/edit/orphan/artists');
}

// 清理孤儿歌手
export const cleanupOrphanArtists = (artist_ids: number[]) => {
  return generalAlova.Post<OrphanCleanupResult>('/admin/edit/orphan/artists/cleanup', { artist_ids });
}
// #endregion

// #region backup and restore
export const getUserList = () => { 
  return generalAlova.Get<UserDetail[]>("/admin/backup/getuserlist");
}
export const exportUserPlaylistData = (user_id: number) => { 
  return downloadAlova.Get("/admin/backup/exportuserplaylistdata", {params: {user_id}, responseType: 'blob'});
}
export const exportUserHitData = (user_id: number) => { 
  return downloadAlova.Get("/admin/backup/exportuserhitdata", {params: {user_id}, responseType: 'blob'});
}
export const exportUserFavData = (user_id: number) => { 
  return downloadAlova.Get("/admin/backup/exportuserfavdata", {params: {user_id}, responseType: 'blob'});
}
export const importUserPlaylistData = (formData: FormData) => { 
  return generalAlova.Post<ImportResult>("/admin/backup/importuserplaylistdata", formData, {shareRequest: false});
}
export const importUserHitData = (formData: FormData) => { 
  return generalAlova.Post<ImportResult>("/admin/backup/importuserhitdata", formData, {shareRequest: false});
}
export const importUserFavData = (formData: FormData) => { 
  return generalAlova.Post<ImportResult>("/admin/backup/importuserfavdata", formData, {shareRequest: false});
}
// export const backupAllPlaylists = () => { 
//   return generalAlova.Get<ResponseData<number>>("/backupallplaylists", {cacheFor: 0});
// }
// export const backupAllHits = () => { 
//   return generalAlova.Get<ResponseData<number>>("/backupallhits", {cacheFor: 0});
// }
// export const restoreAllPlaylists = () => { 
//   return generalAlova.Get<ResponseData<Record<string, string>>>("/restoreallplaylists", {cacheFor: 0});
// }
// export const restoreAllHits = () => { 
//   return generalAlova.Get<ResponseData<string>>("/restoreallhits", {cacheFor: 0});
// }
// #endregion

// #region  Scan
export const getScanFolder = () => { 
  return generalAlova.Get<ScanFolder>("/admin/scan/scanfolderinfo");
}
export const startScan = (is_incremental: boolean) => { 
  return generalAlova.Post<string>("/admin/scan/start", {is_incremental});
}
export const stopScan = () => { 
  return generalAlova.Post<string>("/admin/scan/cancel");
}
// #endregion

// #region  Artwork
export const startArtworkGeneration = (art_types: string[] | null = null) => { 
  return generalAlova.Post<string>("/admin/artwork/start", { art_types });
}
export const cancelArtworkGeneration = () => { 
  return generalAlova.Post<string>("/admin/artwork/cancel");
}
// #endregion

// #region  Playlist
export const getTmpPlaylistJsons = () => { 
  return generalAlova.Get<PlaylistJson[]>("/admin/backup/gettmpplaylistjsons");
}
export const getCurrentPlaylists = () => {
  return generalAlova.Get<PlaylistBackupInfo[]>("/admin/backup/getcurplaylists");
}
export const getAllPlaylists = () => {
  return generalAlova.Get<PlaylistBackupInfo[]>("/admin/backup/getallplaylists");
}
export const createPlaylistFromJson = (file_name: string) => {
  return generalAlova.Post<string>("/admin/backup/createplaylistfromjson",{file_name});
}
export const backupPlaylist = (id: number) => { 
  return downloadAlova.Get("/admin/backup/backupplaylist", {params: {playlist_id: id}, responseType: 'blob'});
}
export const deleteJson = (filename: string) => {
  return generalAlova.Delete<string>("/admin/backup/deleteplaylistjson",{filename});
}
// #endregion

// #region logs
export const getLogTypes = () => { 
  return generalAlova.Get<LogTypes>("/admin/log/types");
}
export const getLogs = (
  log_type: string | undefined, 
  level: string | undefined, 
  keyword: string | undefined, 
  start_time: string | undefined, 
  end_time: string | undefined, 
  page: number, 
  page_size: number
) => { 
  const params: Record<string, string | number> = {page, page_size}
  if (log_type) params.log_type = log_type;
  if (level) params.level = level;
  if (keyword) params.keyword = keyword;
  if (start_time) params.start_time = start_time;
  if (end_time) params.end_time = end_time;
  return generalAlova.Get<LogPagination>("/admin/log", {params});
}
export const exportLogs = (
  log_type: string | undefined, 
  level: string | undefined, 
  keyword: string | undefined, 
  start_time: string | undefined, 
  end_time: string | undefined
) => { 
  const params: Record<string, string> = {}
  if (log_type) params.log_type = log_type;
  if (level) params.level = level;
  if (keyword) params.keyword = keyword;
  if (start_time) params.start_time = start_time;
  if (end_time) params.end_time = end_time;
  return generalAlova.Get<string>("/admin/log/export", {params});
}
// #endregion

// #region tools
export const getArtistArts = (option: {area: string, char_range: string}) => { 
  return generalAlova.Post<{name: string, covers: string[]}[]>("/admin/sysinfo/artistarts", {...option});
}
export const setArtistArts = (option: {area: string, char_range: string, covers: {name: string, cover: string}[]}) => { 
  return generalAlova.Post<{exists: string[], created: string[], no_dirs: string[], total: number}>("/admin/sysinfo/setartistarts", {...option});
}
export const getOutPlaylist = (plink: string) => { 
  return generalAlova.Post<OutPlaylist>("/getoutplaylist", {plink});
}
export const checkTrackFile = (list_text: string) => { 
  return generalAlova.Post<CheckTrackFileResult>("/admin/upload/checktrackfiles",{list_text});
}
export const testPost = (value: string) => { 
  return generalAlova.Post("/admin/sysinfo/test", {text: value}, {
    transform: (res: string) => 'the server response from post is ' + res
  });
}
export const testPostBack = () => { 
  return generalAlova.Post("/admin/sysinfo/backops", {}, {
    transform: (res: string) => 'the server response from backops is ' + res
  });
}
export const testGet = () => { 
  return generalAlova.Get("/admin/sysinfo/test", {
    transform: (res: string) => 'the server response from get is ' + res
  });
}
export const exportAllArtists = () => { 
  return downloadAlova.Get("/admin/backup/exportartists", {responseType: 'blob'});
}
// #endregion