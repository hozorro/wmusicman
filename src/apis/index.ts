import { axiosRequestAdapter } from "@alova/adapter-axios";
import { createAlova } from "alova";
import { createServerTokenAuthentication } from "alova/client";
import adapterFetch from "alova/fetch";
import VueHook from "alova/vue";
import { refreshToken } from "@/apis/methods/manage";

const { onAuthRequired, onResponseRefreshToken } = createServerTokenAuthentication<typeof VueHook>({
  assignToken: (method) => {
    if (method.meta?.authRole === 'refreshToken') {
      method.config.headers.Authorization ='Bearer ' + localStorage.getItem('refresh_token')
    } else {
      method.config.headers.Authorization ='Bearer ' + localStorage.getItem('token')
    }
  },
  refreshTokenOnSuccess: {
    isExpired: (response) => {
      return response.status === 401
    },
    handler: async () => {
      try {
        const resp = await refreshToken()
        const {access_token} = resp.data
        localStorage.setItem('token', access_token)
      } catch (error) {
        location.href = '/login'
        throw error
      }
    },
    metaMatches: {
      refreshToken: true
    }
  },
  async login(response) {
    const resData = await response.clone().json()
    localStorage.setItem('token', resData.data.access_token)
    localStorage.setItem('refresh_token', resData.data.refresh_token)
  }
});

export const generalAlova = createAlova({
  baseURL: '/api/',
  statesHook: VueHook,
  cacheFor: {GET: 300000, POST: 0},
  requestAdapter: adapterFetch(),
  beforeRequest: onAuthRequired(),
  responded: onResponseRefreshToken({
    onSuccess: async (response) => {
      if (response.status >= 500) {
        alert('响应错误')
        return
      }
      else if (response.status > 400) {
        alert('请求错误')
        return
      }
      else if (response.status == 400) {
        const resp = await response.clone().json()
        console.log(resp)
        alert('数据错误')
        return
      } else {
        const resData = await response.json()
        console.log(resData)
        if(resData.code !== 200){
          alert('业务错误['+resData.code+']\n'+resData.msg)
          return
        }
        return resData
      }
    },
    onError: (error) => {
      alert('网络错误：' + error.message)
    }
  }),
});
export const uploadAlova = createAlova({
  baseURL: "/api/admin/",
  statesHook: VueHook,
  requestAdapter: axiosRequestAdapter(),
  shareRequest: false,
  timeout: 600000,
  responded: {
    onSuccess: (response) => {
      if (response.status >= 400) {
        alert('请求错误')
      }
      return response.data
    },
    onError: (err) => {
      alert('网络错误:' + err.message)
    }
  }
});