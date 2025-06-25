import { generalAlova, uploadAlova } from "..";

const baseSrcURL = import.meta.env.VITE_BASE_SRC_URL;
export const getServerInfo = () => {
  return generalAlova.Get<ResponseData<ServerInfo>>("/getserverinfo");
}

// #region upload and transfer
export const uploadFile = (file: File, name: string) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("name", name);
  return uploadAlova.Post("/uploadfile", formData);
}
export const getFiles = () => {
  return generalAlova.Get<ResponseData<TrackFile[]>>("/getfiles");
}
export const switchVersionType = (path: string, ver_type: string) => {
  return generalAlova.Post<ResponseData<TrackFile>>("/switchversiontype", { path, ver_type });
}
export const cleanMetaTag = (items: {path: string, ver_type: string}[]) => { 
  return generalAlova.Post("/cleanmetatag", {items});
}
export const updateMetaTags = (items: string[], change: ChangeInfo) => { 
  return generalAlova.Post("/updatemetatags", {items, change});
}
export const updateFieldTag = (items: string[], field: keyof TrackFile, value: string) => { 
  return generalAlova.Post("/updatefieldtag", {items, field, value});
}
export const transferFiles = (items: string[], lang: string, playlist: string) => { 
  return generalAlova.Post("/transferfiles", {items, lang, playlist});
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
export const getArtists = (achar: string) => { 
  return generalAlova.Get<ResponseData<Artist[]>>("/getartists/" + achar);
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
        cover: baseSrcURL + 'getcover?id=' + id,
        tracks: res.data.tracks.map(item => ({
          ...item,
          cover: baseSrcURL + 'getcover?size=512&id=' + item.id,
        })),
      };
    }
  });
}
export const uploadArtistArt = (id: string, formData: FormData) => {
  return uploadAlova.Post("/uploadartistart/" + id, formData, {
    shareRequest: false
  });
}
export const uploadAlbumArt = (id: string, formData: FormData) => {
  return uploadAlova.Post("/uploadalbumart/" + id, formData);
}
export const updateTrackFieldTag = (items: string[], field: keyof Track, value: string) => { 
  return generalAlova.Post("/updatetrackfieldtag", {items, field, value});
}
// #endregion

// #region  Scan
export const getFolderStatus = () => { 
  return generalAlova.Get<ResponseData<ScanFolder[]>>("/getfolderstatus");
}
export const scanFolders = () => { 
  return generalAlova.Get<ResponseData<string>>("/scanfolders");
}
export const getScanStatus = () => { 
  return generalAlova.Get<ResponseData<number>>("/getscanstatus");
}
// #endregion

// #region  Playlist
export const getTmpPlaylistJsons = () => { 
  return generalAlova.Get<ResponseData<{title: string, files: string[]}[]>>("/gettmpplaylistjsons");
}
export const createPlaylistFromJson = (title: string) => {
  return generalAlova.Post<ResponseData<{count: number, playlist: string}>>("/createplaylistfromjson",{title});
}
export const deleteJson = (title: string) => {
  return generalAlova.Post<ResponseData<string>>("/deletejson",{title});
}
// #endregion

// #region logs
export const getLogs = () => { 
  return generalAlova.Get<ResponseData<string[]>>("/getlogs");
}
// #endregion