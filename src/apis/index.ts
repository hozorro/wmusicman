import { axiosRequestAdapter } from "@alova/adapter-axios";
import { createAlova } from "alova";
import { createServerTokenAuthentication } from "alova/client";
import VueHook from "alova/vue";
import { refreshToken } from "@/apis/methods/manage";
import { TokenStorage } from "@/utils/auth";
import type { AxiosError } from "axios";
import { normalizeError } from "@/errors/normalizeError";
import { handleGlobalApiError } from "@/errors/handlers";
import { toast } from "@/composables/toast";

const { onAuthRequired, onResponseRefreshToken } = createServerTokenAuthentication<typeof VueHook, typeof axiosRequestAdapter>({
  assignToken: (method) => {
    const token = TokenStorage.getAccessToken()
    method.config.headers.Authorization = `Bearer ${token}`
  },
  refreshTokenOnError: {
    isExpired: (error, method) => {
      if(method.meta?.authRole === "refreshToken") return false
      return error.response.status === 401;
    },
    handler: async () => {
      try {
        const do_refresh_token = TokenStorage.getRefreshToken()
        if (!do_refresh_token) throw new Error('refresh_token not found')
        const { access_token, refresh_token } = await refreshToken(do_refresh_token)
        TokenStorage.setAccessToken(access_token)
        TokenStorage.setRefreshToken(refresh_token)
      } catch(error) {
        // Only clear tokens, do NOT call router.push here.
        // The router guard (beforeEach) is solely responsible for auth redirects.
        TokenStorage.clear()
        throw error;
      }
    },
    metaMatches: {
      refreshToken: true,
    }
  },
  async login(response) {
    const { access_token, refresh_token } = await response.data.data
    TokenStorage.setAccessToken(access_token)
    TokenStorage.setRefreshToken(refresh_token)
  }
})

export const generalAlova = createAlova({
  baseURL: '/api/',
  statesHook: VueHook,
  cacheFor: {GET: 1000 * 60 * 5, POST: 0},
  requestAdapter: axiosRequestAdapter(),
  timeout: 1000 * 60 * 10,
  beforeRequest: onAuthRequired(method => {
    method.config.headers['X-Client-Type'] = import.meta.env.VITE_CLIENT_TYPE || 'admin'
    method.config.headers['X-Device-ID'] = TokenStorage.getDeviceId()
  }),
  responded: onResponseRefreshToken({
    onSuccess: async (response) => {
      const resData = await response.data
      console.log(resData)
      if (resData.code !==200) {
        toast(`Data error[${resData.code}]: ${resData.msg}`, 'error')
        return
      }
      return resData.data
    },
    onError: (rawError: AxiosError, method) => {
      console.error(rawError)
      const error = normalizeError(rawError, method)
      handleGlobalApiError(error, method)
      throw error
    }
  }),
})

export const downloadAlova = createAlova({
  baseURL: '/api/',
  statesHook: VueHook,
  cacheFor: null,
  requestAdapter: axiosRequestAdapter(),
  timeout: 1000 * 60 * 10,
  beforeRequest: onAuthRequired(method => {
    method.config.headers['X-Client-Type'] = import.meta.env.VITE_CLIENT_TYPE || 'admin'
    method.config.headers['X-Device-ID'] = TokenStorage.getDeviceId()
  }),
  responded: onResponseRefreshToken({
    onSuccess: async (response) => response,
    onError: (rawError: AxiosError, method) => {
      console.error(rawError)
      const error = normalizeError(rawError, method)
      handleGlobalApiError(error, method)
      throw error
    }
  }),
})
