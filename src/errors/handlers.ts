import { useAuthStore } from "@/store/auth";
import type { Method } from "alova";
import type { ApiError } from "./apiError";
import { toast } from "@/composables/toast";
import { wAlert } from "@/composables/walert";

export function handleGlobalApiError(error: ApiError, method: Method) {
  if (error.handleByGlobal) return
  error.handleByGlobal = true

  // 1. report - not implemented

  // 2. login error
  if (error.code === 20001 || error.httpStatus === 401) {
    const isLoginRequest = method?.meta?.authRole === 'login'
    if (!isLoginRequest) {
      const authStore = useAuthStore()
      authStore.redirectToLogin()
      return
    }
  }

  // 3. silent
  if (error.display === 'silent') {
    return
  }

  // 4. form
  if (error.display === 'form') {
    return
  }

  // 5. page
  if (error.display === 'page') {
    return
  }

  // 6. report
  if (error.display === 'report') {
    const message = `[${error.code}] ${error.message ?? 'An error occurred'}`
    return wAlert(message, JSON.stringify(error.detail) ?? '')
  }

  // 6. 普通操作错误默认 toast
  const message = `[${error.code}] ${error.message ?? 'An error occurred'}`
  toast(message, 'error')
}
