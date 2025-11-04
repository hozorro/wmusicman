import { generalAlova, uploadAlova } from "..";

const baseSrcURL = import.meta.env.VITE_BASE_SRC_URL;

export const login = (username: string, password: string) => { 
  const formData = new FormData();
  formData.append("username", username);
  formData.append("password", password);
  const method = generalAlova.Post<ResponseData<{'access_token': string, 'refresh_token': string, 'token_type': string}>>("/auth/login", formData);
  method.meta = { authRole: 'login' }
  return method;
}
export const refreshToken = () => {
  const method = generalAlova.Post<ResponseData<{'access_token': string, 'token_type': string}>>('/auth/refresh')
  method.meta = { authRole: 'refreshToken' }
  return method;
}
export const register = (username: string, password: string, is_admin: boolean) => { 
  const method = generalAlova.Post<ResponseData<string>>("/auth/register", {username, password, is_admin});
  method.meta = { authRole: null }
  return method;
}
export const getCurrentUser = () => { 
  return generalAlova.Get<ResponseData<any>>("/auth/me");
}

// #region Index
export const checkInitialized = () => { 
  const method = generalAlova.Get<ResponseData<{'initialized': boolean}>>("/system/initialized");
  method.meta = { authRole: null }
  return method;
}
export const getServerInfo = () => {
  return generalAlova.Get<ResponseData<any>>("/admin/dashboard/stats");
}
export const startWatcher = () => { 
  return generalAlova.Post<ResponseData<string>>("/admin/scan/startwatcher");
}
export const stopWatcher = () => { 
  return generalAlova.Post<ResponseData<string>>("/admin/scan/stopwatcher");
}
export const startScan = () => { 
  return generalAlova.Post<ResponseData<string>>("/admin/scan/start");
}
export const stopScan = () => { 
  return generalAlova.Post<ResponseData<string>>("/admin/scan/cancel");
}
export const getScanningStatus = () => { 
  return generalAlova.Get<ResponseData<{user: string, is_running: boolean, progress: Record<string, any>}>>("/admin/scan/progress");
}

export const clearMoveMode = () => { 
  // 清除移动模式，deprecated
  return generalAlova.Get<ResponseData<string>>("/clearmovemode");
}
export const getDbMetaInfo = () => { 
  // 获取数据库元信息， deprecated
  return generalAlova.Get<ResponseData<IMetaInfo>>("/getdbmetainfo");
}
export const getArtistStatistics = () => { 
  // 获取歌手统计信息， deprecated
  return generalAlova.Get<ResponseData<{name:string, count: number}[]>>("/getartiststatistics");
}

// #endregion

// #region upload and transfer(stagging)
export const uploadFile = (file: File, name: string) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("name", name);
  return uploadAlova.Post("/upload/uploadfile", formData, { shareRequest: false});
}
// export const getStageSessions = () => { 
//   return generalAlova.Get<ResponseData<StageSession[]>>("/getstagesessions");
// }
export const getFiles = () => {
  return generalAlova.Get("/getfiles",{
    transform: (res: ResponseData<TrackFile[]>) => {
      return res.data.map((item) => {
        return {
          ...item,
          ver_activate: 0,
          id: item.path
        }
      })
    }
  });
}
export const switchVersionType = (path: string, ver_type: string) => {
  return generalAlova.Post<ResponseData<TrackFile>>("/switchversiontype", { path, ver_type });
}
export const cleanMetaTag = (items: {path: string, ver_type: string}[]) => { 
  return generalAlova.Post<ResponseData<string>>("/cleanmetatag", {items});
}
export const updateMetaTags = (items: string[], change: ChangeInfo) => { 
  return generalAlova.Post<ResponseData<string>>("/updatemetatags", {items, change});
}
export const updateFieldTag = (items: string[], field: keyof TrackFile, value: string) => { 
  return generalAlova.Post<ResponseData<string>>("/updatefieldtag", {items, field, value});
}
export const transferFiles = (items: string[], lang: string, playlist: string) => { 
  return generalAlova.Post<ResponseData<string>>("/transferfiles", {items, lang, playlist});
}
// #endregion

// #region  Edit
export const getArtistChars = () => { 
  return generalAlova.Get("/getartistchars",{
    transform: (res: ResponseData<[string,boolean][]>) => {
      return res.data.map(item => ({
        charName: item[0], 
        hasArtist: item[1],
      }));
    }
  });
}
export const getArtists = (achar: string, with_no_path: boolean = false) => { 
  return generalAlova.Get<ResponseData<Artist[]>>("/getartists/" + achar, {params:{with_no_path}});
}
export const getArtist = (id: string) => { 
  return generalAlova.Get("/getartist/" + id, {
    transform: (res: ResponseData<ArtistInfo>) => {
      return {
        ...res.data,
        face: baseSrcURL + 'getartistart?type=face&id=' + res.data.id,
        portrait: baseSrcURL + 'getartistart?type=portrait&id=' + res.data.id,
      };
    }
  });
}
export const getAlbum = (id: string) => { 
  return generalAlova.Get("/getalbum/" + id, {
    transform: (res: ResponseData<AlbumInfo>) => {
      return {
        ...res.data,
        cover: baseSrcURL + 'getcover?size=512&id=' + id,
        tracks: res.data.tracks.map(item => ({
          ...item,
          cover: baseSrcURL + 'getcover?size=512&id=' + item.id,
        })),
      };
    }
  });
}
export const setArtistPath = (id: string, lang?: string) => {
  return generalAlova.Post<ResponseData<string>>("/setartistpath/" + id, {lang});
}
export const uploadArtistArt = (id: string, formData: FormData) => {
  return uploadAlova.Post<ResponseData<string>>("/uploadartistart/" + id, formData, {
    shareRequest: false
  });
}
export const uploadAlbumArt = (id: string, formData: FormData) => {
  return uploadAlova.Post<ResponseData<string>>("/uploadalbumart/" + id, formData);
}
export const updateTrackFieldTag = (items: string[], field: keyof Track, value: string, area?: string) => { 
  return generalAlova.Post<ResponseData<string>>("/updatetrackfieldtag", {items, field, value, area});
}
export const correctName = (id: string) => { 
  return generalAlova.Get<ResponseData<string>>("/correctname/" + id);
}
// #endregion

// #region backup and restore
export const backupAllPlaylists = () => { 
  return generalAlova.Get<ResponseData<number>>("/backupallplaylists", {cacheFor: 0});
}
export const backupAllHits = () => { 
  return generalAlova.Get<ResponseData<number>>("/backupallhits", {cacheFor: 0});
}
export const restoreAllPlaylists = () => { 
  return generalAlova.Get<ResponseData<Record<string, string>>>("/restoreallplaylists", {cacheFor: 0});
}
export const restoreAllHits = () => { 
  return generalAlova.Get<ResponseData<string>>("/restoreallhits", {cacheFor: 0});
}
// #endregion

// #region  Scan
export const getFolderStatus = () => { 
  return generalAlova.Get<ResponseData<ScanFolder[]>>("/getfolderstatus");
}
export const scanFolders = () => { 
  return generalAlova.Get<ResponseData<string>>("/scanfolders", { cacheFor: 0 });
}
export const getScanStatus = () => { 
  return generalAlova.Get<ResponseData<number>>("/getscanstatus", { cacheFor: 0 });
}
// #endregion

// #region  Playlist
export const getTmpPlaylistJsons = () => { 
  return generalAlova.Get<ResponseData<{title: string, filename: string, source: string, items: string[]}[]>>("/gettmpplaylistjsons");
}
export const getCurrentPlaylists = () => {
  return generalAlova.Get<ResponseData<{title: string, filename: string, source: string, items: string[]}[]>>("/getcurrentplaylists");
}
export const createPlaylistFromJson = (title: string, file_name: string) => {
  return generalAlova.Post<ResponseData<{count: number, original_count: number, playlist: string}>>("/createplaylistfromjson",{title, file_name});
}
export const backupPlaylist = (id: string) => { 
  return generalAlova.Post<ResponseData<string>>("/backupplaylist",{id});
}
export const deleteJson = (filename: string) => {
  return generalAlova.Post<ResponseData<string>>("/deletejson",{filename});
}
// #endregion

// #region logs
export const getLogs = () => { 
  return generalAlova.Get<ResponseData<string[]>>("/getlogs");
}
// #endregion

// #region tools
export const getOutPlaylist = (plink: string) => { 
  return generalAlova.Post<ResponseData<OutPlaylist>>("/getoutplaylist", {plink});
}
// #endregion