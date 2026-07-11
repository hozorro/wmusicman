import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getFileName,
  getFileNameWithoutExt,
  formatSize,
  timeStampToDate,
  formatTimeDuration,
  compareValue,
  compareArray,
  get_set,
  getUniformFieldValueSingle,
  getUniformFieldValueArray,
  AssetImageCache
} from '@/utils/general'

describe('getFileName', () => {
  it('should return filename from Unix path', () => {
    expect(getFileName('/music/artist/song.mp3')).toBe('song.mp3')
  })

  it('should return filename from Windows path', () => {
    expect(getFileName('C:\\music\\artist\\song.mp3')).toBe('song.mp3')
  })

  it('should return empty string for empty input', () => {
    expect(getFileName('')).toBe('')
    expect(getFileName('   ')).toBe('')
  })

  it('should return empty string for directory path ending with slash', () => {
    expect(getFileName('/music/artist/')).toBe('')
  })

  it('should handle path with only filename', () => {
    expect(getFileName('song.mp3')).toBe('song.mp3')
  })
})

describe('getFileNameWithoutExt', () => {
  it('should return filename without extension', () => {
    expect(getFileNameWithoutExt('/music/song.flac')).toBe('song')
  })

  it('should return filename as-is when no extension', () => {
    expect(getFileNameWithoutExt('/music/song')).toBe('song')
  })

  it('should handle hidden files (starting with dot)', () => {
    expect(getFileNameWithoutExt('/music/.gitignore')).toBe('.gitignore')
  })

  it('should handle Windows path', () => {
    expect(getFileNameWithoutExt('C:\\music\\song.mp3')).toBe('song')
  })

  it('should handle file with multiple dots', () => {
    expect(getFileNameWithoutExt('/music/song.remastered.mp3')).toBe('song.remastered')
  })
})

describe('formatSize', () => {
  it('should format bytes', () => {
    expect(formatSize(0)).toBe('0 B')
    expect(formatSize(1023)).toBe('1023 B')
  })

  it('should format kilobytes', () => {
    expect(formatSize(1024)).toBe('1.00 KB')
    expect(formatSize(1536)).toBe('1.50 KB')
  })

  it('should format megabytes', () => {
    expect(formatSize(1048576)).toBe('1.00 MB')
    expect(formatSize(1572864)).toBe('1.50 MB')
  })

  it('should format gigabytes', () => {
    expect(formatSize(1073741824)).toBe('1.00 GB')
    expect(formatSize(1610612736)).toBe('1.50 GB')
  })
})

describe('timeStampToDate', () => {
  it('should return string for small timestamps', () => {
    expect(timeStampToDate(100)).toBe('100')
    expect(timeStampToDate(369743024)).toBe('369743024')
  })

  it('should format normal timestamp as YYYY-MM-DD HH:mm:ss', () => {
    // 2020-01-01 00:00:00 UTC = 1577836800
    const result = timeStampToDate(1577836800)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
  })

  it('should handle timestamp at boundary', () => {
    // 369743025 is the boundary
    const result = timeStampToDate(369743025)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
  })
})

describe('formatTimeDuration', () => {
  it('should format 0 seconds', () => {
    expect(formatTimeDuration(0)).toBe('00:00')
  })

  it('should format seconds only', () => {
    expect(formatTimeDuration(65)).toBe('01:05')
  })

  it('should format with hours', () => {
    expect(formatTimeDuration(3661)).toBe('01:01:01')
  })

  it('should format minutes and seconds', () => {
    expect(formatTimeDuration(125)).toBe('02:05')
  })

  it('should format hours with padding', () => {
    expect(formatTimeDuration(36000)).toBe('10:00:00')
  })
})

describe('compareValue', () => {
  it('should compare strings', () => {
    expect(compareValue('abc', 'def')).toBeLessThan(0)
    expect(compareValue('def', 'abc')).toBeGreaterThan(0)
    expect(compareValue('abc', 'abc')).toBe(0)
  })

  it('should compare numbers', () => {
    expect(compareValue(1, 2)).toBeLessThan(0)
    expect(compareValue(2, 1)).toBeGreaterThan(0)
    expect(compareValue(1, 1)).toBe(0)
  })

  it('should compare arrays by first element', () => {
    expect(compareValue(['a'], ['b'])).toBeLessThan(0)
    expect(compareValue(['b'], ['a'])).toBeGreaterThan(0)
  })
})

describe('compareArray', () => {
  it('should return true for same elements in different order', () => {
    expect(compareArray(['a', 'b'], ['b', 'a'])).toBe(true)
  })

  it('should return false for different elements', () => {
    expect(compareArray(['a'], ['b'])).toBe(false)
  })

  it('should return true for empty arrays', () => {
    expect(compareArray([], [])).toBe(true)
  })

  it('should return true for same elements in same order', () => {
    expect(compareArray(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(true)
  })

  it('should return false for different lengths', () => {
    expect(compareArray(['a', 'b'], ['a'])).toBe(false)
  })
})

describe('get_set', () => {
  it('should return value when all items have same value', () => {
    const items = [
      { name: 'Alice', age: 25 },
      { name: 'Bob', age: 25 },
      { name: 'Charlie', age: 25 }
    ]
    expect(get_set(items, 'age')).toBe(25)
  })

  it('should return *多值* when values differ', () => {
    const items = [
      { name: 'Alice', age: 25 },
      { name: 'Bob', age: 30 }
    ]
    expect(get_set(items, 'age')).toBe('*多值*')
  })

  it('should handle single item', () => {
    const items = [{ name: 'Alice', age: 25 }]
    expect(get_set(items, 'age')).toBe(25)
  })
})

describe('getUniformFieldValueSingle', () => {
  const tracks = [
    { id: 1, title: 'Song A', year: 2020 },
    { id: 2, title: 'Song B', year: 2020 },
    { id: 3, title: 'Song C', year: 2021 }
  ]

  it('should return uniform value when all selected items have same value', () => {
    const result = getUniformFieldValueSingle(tracks, 'year', [1, 2], 'id')
    expect(result.uniformValue).toBe('2020')
    expect(result.isDifferent).toBe(false)
  })

  it('should return isDifferent true when values differ', () => {
    const result = getUniformFieldValueSingle(tracks, 'year', [1, 3], 'id')
    expect(result.uniformValue).toBe('')
    expect(result.isDifferent).toBe(true)
  })

  it('should return empty when no items selected', () => {
    const result = getUniformFieldValueSingle(tracks, 'year', [], 'id')
    expect(result.uniformValue).toBe('')
    expect(result.isDifferent).toBe(false)
  })

  it('should handle single selected item', () => {
    const result = getUniformFieldValueSingle(tracks, 'title', [2], 'id')
    expect(result.uniformValue).toBe('Song B')
    expect(result.isDifferent).toBe(false)
  })
})

describe('getUniformFieldValueArray', () => {
  const tracks = [
    { id: 1, title: 'Song A', genres: ['Pop', 'Rock'] as string[] },
    { id: 2, title: 'Song B', genres: ['Rock', 'Pop'] as string[] },
    { id: 3, title: 'Song C', genres: ['Jazz'] as string[] }
  ]

  it('should return uniform value when arrays are same after sorting', () => {
    const result = getUniformFieldValueArray(tracks, 'genres', [1, 2], 'id')
    expect(result.uniformValue).toEqual(['Pop', 'Rock'])
    expect(result.isDifferent).toBe(false)
  })

  it('should return isDifferent true when arrays differ', () => {
    const result = getUniformFieldValueArray(tracks, 'genres', [1, 3], 'id')
    expect(result.uniformValue).toEqual([''])
    expect(result.isDifferent).toBe(true)
  })

  it('should return empty array when no items selected', () => {
    const result = getUniformFieldValueArray(tracks, 'genres', [], 'id')
    expect(result.uniformValue).toEqual([''])
    expect(result.isDifferent).toBe(false)
  })
})

describe('AssetImageCache', () => {
  let cache: AssetImageCache

  beforeEach(() => {
    cache = new AssetImageCache()
    // Mock global fetch
    global.fetch = vi.fn()
  })

  it('should fetch and cache image on first call', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/jpeg' })
    vi.mocked(global.fetch).mockResolvedValueOnce({
      blob: () => Promise.resolve(mockBlob)
    } as Response)

    const result = await cache.getImage('http://example.com/img.jpg', 'img.jpg')
    
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(result).toBeInstanceOf(File)
    expect(result?.name).toBe('img.jpg')
  })

  it('should return cached image on subsequent calls', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/jpeg' })
    vi.mocked(global.fetch).mockResolvedValueOnce({
      blob: () => Promise.resolve(mockBlob)
    } as Response)

    // First call - fetches
    await cache.getImage('http://example.com/img.jpg', 'img.jpg')
    // Second call - should use cache
    const result = await cache.getImage('http://example.com/img.jpg', 'img.jpg')
    
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(result).toBeInstanceOf(File)
  })

  it('should clear cache', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/jpeg' })
    vi.mocked(global.fetch).mockResolvedValue({
      blob: () => Promise.resolve(mockBlob)
    } as Response)

    await cache.getImage('http://example.com/img.jpg', 'img.jpg')
    cache.clear()
    await cache.getImage('http://example.com/img.jpg', 'img.jpg')
    
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })
})
