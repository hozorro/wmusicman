import { axiosRequestAdapter } from "@alova/adapter-axios";
import { createAlova } from "alova";
import { createServerTokenAuthentication } from "alova/client";
import VueHook from "alova/vue";
import { refreshToken } from "@/apis/methods/manage";

const { onAuthRequired, onResponseRefreshToken } = createServerTokenAuthentication<typeof VueHook, typeof axiosRequestAdapter>({
  assignToken: (method) => {
    if (method.meta?.authRole === "refreshToken") {
      method.config.headers.Authorization = `Bearer ${localStorage.getItem("refresh_token")}`;
    } else {
      method.config.headers.Authorization = `Bearer ${localStorage.getItem("token")}`;
    }
  },
  refreshTokenOnError: {
    isExpired: (error, method) => {
      if(method.meta?.authRole === "refreshToken") return false
      return error.response.status === 401;
    },
    handler: async () => {
      try {
        const {access_token} = await refreshToken();
        localStorage.setItem("token", access_token);
      } catch(error) {
        location.href = "/login";
        throw error;
      }
    },
    metaMatches: {
      refreshToken: true,
    }
  },
  async login(response) {
    const { access_token, refresh_token } = await response.data.data
    localStorage.setItem("token", access_token);
    localStorage.setItem("refresh_token", refresh_token);
  }
})

export const generalAlova = createAlova({
  baseURL: '/api/',
  statesHook: VueHook,
  cacheFor: {GET: 1000 * 60 * 5, POST: 0},
  requestAdapter: axiosRequestAdapter(),
  timeout: 1000 * 60 * 10,
  beforeRequest: onAuthRequired(),
  responded: onResponseRefreshToken({
    onSuccess: (response) => {
      console.log(response.data)
      return response.data.data
    },
    onError: (error) => {
      console.log(error)
      if(error.status === 401) {
        alert('登录已过期，请重新登录')
      }else{
        alert(`错误[${error.status}]: ${error.message}`)
      }
      throw error
    }
  }),
})