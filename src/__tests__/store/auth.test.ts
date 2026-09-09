import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/store/auth'
import { TokenStorage } from '@/utils/auth'

// Mock API methods
vi.mock('@/apis/methods/manage', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  refreshToken: vi.fn(),
  getCurrentUser: vi.fn()
}))

// Mock router
vi.mock('@/router', () => ({
  default: {
    push: vi.fn(),
    currentRoute: { value: { fullPath: '/test' } }
  }
}))

import { login as loginApi, logout as logoutApi, refreshToken as refreshApi, getCurrentUser } from '@/apis/methods/manage'
import router from '@/router'

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should not be authenticated without token', () => {
      const store = useAuthStore()
      expect(store.isAuthenticated).toBe(false)
    })

    it('should be authenticated if token exists in localStorage', () => {
      localStorage.setItem('admin_access_token', 'existing-token')
      // Need to create a new store instance to pick up the token
      setActivePinia(createPinia())
      const store = useAuthStore()
      expect(store.isAuthenticated).toBe(true)
    })

    it('should have isLogining as false initially', () => {
      const store = useAuthStore()
      expect(store.isLogining).toBe(false)
    })

    it('should have null userInfo initially', () => {
      const store = useAuthStore()
      expect(store.userInfo).toBeNull()
    })
  })

  describe('login', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token'
      }
      vi.mocked(loginApi).mockResolvedValueOnce(mockResponse)
      vi.mocked(getCurrentUser).mockResolvedValueOnce({ id: 1, username: 'testuser' })

      const store = useAuthStore()
      const result = await store.login('testuser', 'password')

      expect(result).toBe(true)
      expect(store.accessToken).toBe('new-access-token')
      expect(store.refreshToken).toBe('new-refresh-token')
      expect(store.isAuthenticated).toBe(true)
      expect(store.userInfo).toEqual({ id: 1, username: 'testuser' })
      expect(TokenStorage.getAccessToken()).toBe('new-access-token')
      expect(TokenStorage.getRefreshToken()).toBe('new-refresh-token')
    })

    it('should handle login failure', async () => {
      vi.mocked(loginApi).mockRejectedValueOnce(new Error('Invalid credentials'))

      const store = useAuthStore()
      const result = await store.login('wrong', 'wrong')

      expect(result).toBe(false)
      expect(store.isAuthenticated).toBe(false)
    })

    it('should set isLogining during login', async () => {
      let loginResolve: (value: any) => void
      vi.mocked(loginApi).mockImplementationOnce((() => 
        new Promise(resolve => { loginResolve = resolve })
      ) as any)

      const store = useAuthStore()
      const loginPromise = store.login('user', 'pass')

      expect(store.isLogining).toBe(true)
      
      loginResolve!({ access_token: 'token', refresh_token: 'refresh' })
      vi.mocked(getCurrentUser).mockResolvedValueOnce({ id: 1 })
      await loginPromise

      expect(store.isLogining).toBe(false)
    })
  })

  describe('refresh', () => {
    it('should refresh token successfully', async () => {
      const store = useAuthStore()
      store.refreshToken = 'old-refresh-token'
      
      vi.mocked(refreshApi).mockResolvedValueOnce({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token'
      })

      const result = await store.refresh()

      expect(result).toBe(true)
      expect(store.accessToken).toBe('new-access-token')
      expect(store.refreshToken).toBe('new-refresh-token')
    })

    it('should return false when no refresh token', async () => {
      const store = useAuthStore()
      store.refreshToken = ''

      const result = await store.refresh()

      expect(result).toBe(false)
    })

    it('should clear localStorage tokens on refresh failure', async () => {
      const store = useAuthStore()
      store.accessToken = 'old-access'
      store.refreshToken = 'old-refresh'
      
      vi.mocked(refreshApi).mockRejectedValueOnce(new Error('Refresh failed'))

      const result = await store.refresh()

      expect(result).toBe(false)
      // Note: refresh() only calls TokenStorage.clear() in catch block,
      // it does NOT reset the store's reactive refs (accessToken/refreshToken)
      expect(TokenStorage.getAccessToken()).toBeNull()
      expect(TokenStorage.getRefreshToken()).toBeNull()
    })
  })

  describe('logout', () => {
    it('should clear all state and redirect to login', async () => {
      const store = useAuthStore()
      store.accessToken = 'access-token'
      store.refreshToken = 'refresh-token'
      store.userInfo = { id: 1 }

      vi.mocked(logoutApi).mockResolvedValueOnce('ok')

      await store.logout(false)

      expect(store.accessToken).toBe('')
      expect(store.refreshToken).toBe('')
      expect(store.userInfo).toBeNull()
      expect(router.push).toHaveBeenCalledWith({
        path: '/login',
        query: { redirect: '/test' }
      })
    })

    it('should clear state even if logout API fails', async () => {
      const store = useAuthStore()
      store.accessToken = 'access-token'
      
      vi.mocked(logoutApi).mockRejectedValueOnce(new Error('Network error'))

      await store.logout(false)

      expect(store.accessToken).toBe('')
      expect(store.refreshToken).toBe('')
    })
  })

  describe('clear', () => {
    it('should clear all state', () => {
      const store = useAuthStore()
      store.accessToken = 'access-token'
      store.refreshToken = 'refresh-token'
      store.userInfo = { id: 1 }

      store.clear()

      expect(store.accessToken).toBe('')
      expect(store.refreshToken).toBe('')
      expect(store.userInfo).toBeNull()
      expect(TokenStorage.getAccessToken()).toBeNull()
    })
  })

  describe('fetchUserInfo', () => {
    it('should fetch and set user info', async () => {
      const store = useAuthStore()
      vi.mocked(getCurrentUser).mockResolvedValueOnce({ id: 1, username: 'testuser' })

      await store.fetchUserInfo()

      expect(store.userInfo).toEqual({ id: 1, username: 'testuser' })
    })

    it('should set userInfo to null on error', async () => {
      const store = useAuthStore()
      store.userInfo = { id: 1 }
      vi.mocked(getCurrentUser).mockRejectedValueOnce(new Error('Failed'))

      await store.fetchUserInfo()

      expect(store.userInfo).toBeNull()
    })
  })
})
