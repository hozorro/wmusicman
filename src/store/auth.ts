import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { login as loginApi, logout as logoutApi, refreshToken as refreshApi, getCurrentUser } from '@/apis/methods/manage'
import { TokenStorage } from '@/utils/auth'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string>(TokenStorage.getAccessToken() || '')
  const refreshToken = ref<string>(TokenStorage.getRefreshToken() || '')
  const isLogining = ref(false)

  const isAuthenticated = computed(() => !!accessToken.value)
  const appType = computed(() => import.meta.env.VITE_APP_TYPE)

  const userInfo = ref<any>(null)

  async function login(username: string, password: string) {
    isLogining.value = true
    try {
      const { access_token, refresh_token } = await loginApi(username, password)

      TokenStorage.setAccessToken(access_token)
      TokenStorage.setRefreshToken(refresh_token)
      accessToken.value = access_token
      refreshToken.value = refresh_token

      await fetchUserInfo()

      return { success: true }
    } catch (error: any) {
      return { success: false, message: error.message || "Login failed" }
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
        path: '/admin/login',
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

  return { 
    accessToken, 
    refreshToken, 
    userInfo, 
    isAuthenticated, 
    isLogining, 
    appType, 
    login, 
    refresh, 
    fetchUserInfo, 
    logout, 
    clear 
  }
})