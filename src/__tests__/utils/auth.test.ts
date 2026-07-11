import { describe, it, expect, beforeEach } from 'vitest'
import { TokenStorage } from '@/utils/auth'

// The TOKEN_PREFIX defaults to 'admin_' when VITE_TOKEN_PREFIX is not set
const PREFIX = 'admin_'

describe('TokenStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('setAccessToken / getAccessToken', () => {
    it('should store and retrieve access token', () => {
      TokenStorage.setAccessToken('test-access-token')
      expect(TokenStorage.getAccessToken()).toBe('test-access-token')
      expect(localStorage.getItem(`${PREFIX}access_token`)).toBe('test-access-token')
    })

    it('should return null when no access token', () => {
      expect(TokenStorage.getAccessToken()).toBeNull()
    })

    it('should overwrite existing token', () => {
      TokenStorage.setAccessToken('token-1')
      TokenStorage.setAccessToken('token-2')
      expect(TokenStorage.getAccessToken()).toBe('token-2')
    })
  })

  describe('setRefreshToken / getRefreshToken', () => {
    it('should store and retrieve refresh token', () => {
      TokenStorage.setRefreshToken('test-refresh-token')
      expect(TokenStorage.getRefreshToken()).toBe('test-refresh-token')
      expect(localStorage.getItem(`${PREFIX}refresh_token`)).toBe('test-refresh-token')
    })

    it('should return null when no refresh token', () => {
      expect(TokenStorage.getRefreshToken()).toBeNull()
    })
  })

  describe('removeAccessToken', () => {
    it('should remove access token', () => {
      TokenStorage.setAccessToken('test-token')
      TokenStorage.removeAccessToken()
      expect(TokenStorage.getAccessToken()).toBeNull()
    })

    it('should not throw when no token to remove', () => {
      expect(() => TokenStorage.removeAccessToken()).not.toThrow()
    })
  })

  describe('removeRefreshToken', () => {
    it('should remove refresh token', () => {
      TokenStorage.setRefreshToken('test-token')
      TokenStorage.removeRefreshToken()
      expect(TokenStorage.getRefreshToken()).toBeNull()
    })
  })

  describe('clear', () => {
    it('should remove all tokens', () => {
      TokenStorage.setAccessToken('access')
      TokenStorage.setRefreshToken('refresh')
      TokenStorage.clear()
      expect(TokenStorage.getAccessToken()).toBeNull()
      expect(TokenStorage.getRefreshToken()).toBeNull()
    })

    it('should not throw when no tokens exist', () => {
      expect(() => TokenStorage.clear()).not.toThrow()
    })
  })

  describe('hasToken', () => {
    it('should return true when access token exists', () => {
      TokenStorage.setAccessToken('test-token')
      expect(TokenStorage.hasToken()).toBe(true)
    })

    it('should return false when no access token', () => {
      expect(TokenStorage.hasToken()).toBe(false)
    })

    it('should return false after clear', () => {
      TokenStorage.setAccessToken('test-token')
      TokenStorage.clear()
      expect(TokenStorage.hasToken()).toBe(false)
    })
  })

  describe('getDeviceId', () => {
    it('should generate and store device id on first call', () => {
      const deviceId = TokenStorage.getDeviceId()
      expect(deviceId).toBeTruthy()
      expect(typeof deviceId).toBe('string')
      expect(deviceId.length).toBeLessThanOrEqual(32)
      expect(localStorage.getItem(`${PREFIX}device_id`)).toBe(deviceId)
    })

    it('should return same device id on subsequent calls', () => {
      const first = TokenStorage.getDeviceId()
      const second = TokenStorage.getDeviceId()
      expect(first).toBe(second)
    })

    it('should return stored device id if already exists', () => {
      localStorage.setItem(`${PREFIX}device_id`, 'custom-device-id')
      expect(TokenStorage.getDeviceId()).toBe('custom-device-id')
    })
  })
})
