import { generalAlova, downloadAlova } from '@/apis'

// #region lyric index maintenance
// align the lyric table with tracks and index every lyric file on disk (background task)
export const initLyricIndex = () => {
  return generalAlova.Post<null>('/admin/lyric/init', {}, { name: 'lyric-init' })
}
// cancel the running lyric init task
export const cancelLyricInit = () => {
  return generalAlova.Post<null>('/admin/lyric/cancel', {}, { name: 'lyric-cancel' })
}
// submit pending / failed rows to the lyric fetcher queue (background task)
export const fetchLyrics = (limit = 1000) => {
  return generalAlova.Post<null>(`/admin/lyric/fetch?limit=${limit}`, {}, { name: 'lyric-fetch' })
}
// init progress + row counts, polled by the page so the cache must stay off
export const getLyricStatus = () => {
  return generalAlova.Get<LyricStatusInfo>('/admin/lyric/status', { cacheFor: 0 })
}
// import the fetch result csv dumped from the external sqlite tool
export const importLyricFetchResult = (formData: FormData) => {
  return generalAlova.Post<LyricImportFetchResult>('/admin/lyric/import/fetch', formData, { shareRequest: false })
}
// download every best_status = pending row, the rows are stamped as one export round
export const exportLyricBestPending = (limit?: number) => {
  return downloadAlova.Get('/admin/lyric/export/best', {
    params: limit ? { limit } : {},
    responseType: 'blob',
  })
}
// import the best line json produced by the external extractor
export const importLyricBestResult = (formData: FormData) => {
  return generalAlova.Post<LyricImportBestResult>('/admin/lyric/import/best', formData, { shareRequest: false })
}
// #endregion
