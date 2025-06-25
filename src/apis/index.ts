import { axiosRequestAdapter } from "@alova/adapter-axios";
import { createAlova } from "alova";
import adapterFetch from "alova/fetch";
import vueHook from "alova/vue";

export const generalAlova = createAlova({
  baseURL: '/apim/',
  statesHook: vueHook,
  requestAdapter: adapterFetch(),
  responded: {
    onSuccess: async (response) => {
      if (response.status >= 500) {
        alert('响应错误')
        return
      }
      else if (response.status >= 400) {
        alert('请求错误')
        return
      } else {
        const resData = await response.json()
        console.log('响应数据：', resData)
        return resData
      }
    },
    onError: (error) => {
      alert('网络错误：' + error.message)
    }
  }
});
export const uploadAlova = createAlova({
  baseURL: "/apim/",
  statesHook: vueHook,
  requestAdapter: axiosRequestAdapter(),
  shareRequest: false,
  timeout: 300000,
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