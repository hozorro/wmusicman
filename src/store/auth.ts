import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { login as loginApi, logout as logoutApi, refreshToken as refreshApi, getCurrentUser } from '@/apis/methods/manage'
import { TokenStorage } from '@/utils/auth'
import router from '@/router'
import type { ApiError } from '@/errors/apiError'
import { transformApiError, transformFieldError } from '@/errors/transform'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string>(TokenStorage.getAccessToken() || '')
  const refreshToken = ref<string>(TokenStorage.getRefreshToken() || '')
  const isLogining = ref(false)
  const loginErrors = ref<Record<string, any> | null>({})
  const _redirecting = ref(false)

  const isAuthenticated = computed(() => !!accessToken.value)
  const appType = computed(() => import.meta.env.VITE_APP_TYPE)

  const userInfo = ref<any>(null)

  async function login(username: string, password: string) {
    isLogining.value = true
    loginErrors.value = null
    try {
      const { access_token, refresh_token } = await loginApi(username, password)

      TokenStorage.setAccessToken(access_token)
      TokenStorage.setRefreshToken(refresh_token)
      accessToken.value = access_token
      refreshToken.value = refresh_token

      await fetchUserInfo()

      return true
    } catch (rawError) {
      const error = rawError as ApiError
      if (error.code === 20001) {
        loginErrors.value = {
          form: transformApiError(error)
        }
      } else if (error.fields) {
        loginErrors.value = {
          fields: transformFieldError(error.fields)
        }
      } else {
        loginErrors.value = {
          form: transformApiError(error)
        }
      }
      return false
    } finally {
      isLogining.value = false
    }
  }

  async function fetchUserInfo() {
    try {
      userInfo.value = await getCurrentUser()
    } catch (error) {
      userInfo.value = null
    }
  }

  async function refresh() {
    if (!refreshToken.value) return false
    try {
      const { access_token, refresh_token } = await refreshApi(refreshToken.value)

      TokenStorage.setAccessToken(access_token)
      TokenStorage.setRefreshToken(refresh_token)
      accessToken.value = access_token
      refreshToken.value = refresh_token

      return true
    } catch (error: any) {
      TokenStorage.clear()
      return false
    }
  }

  async function logout(allDevices: boolean) {
    try {
      await logoutApi(allDevices)
    } catch (error) {
      // ignore
      console.warn('Logout failed, clearing local tokens.')
    } finally {
      TokenStorage.clear()
      accessToken.value = ''
      refreshToken.value = ''
      userInfo.value = null

      router.push({
        path: '/login',
        query: { redirect: router.currentRoute.value.fullPath }
      })
    }
  }

  function clear() {
    TokenStorage.clear()
    userInfo.value = null
    refreshToken.value = ''
    accessToken.value = ''
  }

  async function redirectToLogin(options?: {
    redirect?: string
    playing?: boolean
  }): Promise<void> {
    if (_redirecting.value) return
    _redirecting.value = true
    
    try {
      await logout(false)
      const currentPath = router.currentRoute.value.fullPath
      const redirect = options?.redirect
        ?? (currentPath !== '/' && currentPath !== '/login' ? currentPath : undefined)
      await router.replace({
        path: '/login',
        query: redirect ? { redirect } : {}
      })
    } finally {
      // 延迟重置锁，防止多个401连续触发
      setTimeout(() => {
        _redirecting.value = false
      }, 1000)
    }
  }

  return { 
    accessToken, 
    refreshToken, 
    userInfo, 
    isAuthenticated, 
    isLogining, 
    loginErrors,
    appType, 
    login, 
    refresh, 
    fetchUserInfo, 
    logout, 
    clear,
    redirectToLogin
  }
})