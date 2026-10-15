import type { ApiError, FieldErrorItem } from "./apiError"

/**
 * Errors Definition
 * - Key: error code, value: error message
 * - Num 1: 2-authentication errors, 5-network errors, 6-media errors, 7-management errors
 * - Num 3: 1-artist, 2-album, 3-track, 4-common, 5-playlist, 6-upload, 7-watcher
 */
const errors: Record<number, string> = {
  20001: "authentication error",
  50001: "network error",
  50002: "timeout",
  50003: "request validation error",
  50404: "unknown error",
  60104: "artist artwork not found",
  60105: "candidate artist artwork not found",
  60106: "failed to save artist art",
  60107: "art_type must be face or portrait",
  60108: "candidate artist artwork not found",
  60109: "failed to upload artist art candidate",
  60110: "failed to set artist art from candidate",
  60113: "artist artwork file size exceeds limit",
  60115: "only jpg and png files are allowed",
  60116: "only jpg and png files are allowed",
  60117: "failed to create artist directory",
  60204: "album artwork not found",
  60205: "cover art fetch error",
  60206: "cover art not found",
  60207: "failed to save album art",
  60215: "only jpg and png files are allowed",
  60304: "track artwork not found",
  60305: "tmp track artwork not found",
  60404: "default artwork not found",
  60405: "failed to set default artwork",
  60415: "only jpg and png files are allowed for artwork",
  60504: "playlist artwork not found",
  70501: "playlist backup error",
  70502: "import playlist from json error",
  70503: "export user playlists to json error",
  70504: "playlist json file not exists",
  70104: "artist not exists",
  70204: "album not exists",
  70301: "failed to move temp file to staging",
  70302: "session not found",
  70303: "error when get session file info",
  70304: "file not found when moving",
  70305: "error when moving file",
  70306: "archive track file partial success",
  70307: "error when update file meta version",
  70308: "invalid batch count when update version of session files",
  70309: "batch count overload when update version of session files",
  70310: "error when update file meta tags",
  70311: "error when generate fingerprint",
  70312: "error when match song metadata",
  70313: "error when fetch cover art",
  70314: "cover art not found",
  70315: "only mp3 and flac files are allowed",
  70316: "update track metadata partial success",
  70317: "error when delete staging files",
  70601: "upload playdata backup file type error",
  70602: "upload playdata backup file size exceed",
  70603: "upload playdata backup file decode error",
  70604: "playdata backup file parse error",
  70605: "playdata backup file json structure error",
  70606: "import hit from json error",
  70607: "import favorite from json error",
  70705: "failed to start watcher",
  70706: "failed to stop watcher",
}

export function transformApiError(error: ApiError): string {
  const code = error.code
  const message = errors[code]
  if (message) {
    let result = `[${code}] ${message}`
    if (error.detail) {
      result += `\nDetail: ${JSON.stringify(error.detail)}`
    }
    return result
  }
  if (error.httpStatus) {
    return `[${code}] HTTP ${error.httpStatus} error.`
  }
  return `[${code}] unknown error`
}

export function transformFieldError(fields: Record<string, FieldErrorItem[]>): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  for (const [field, errors] of Object.entries(fields)) {
    result[field] = errors.map(item => item.type)
  }
  return result
}