import { isAxiosError } from "axios";
import { ApiError, type ApiMethodMeta  } from "./apiError";

export function normalizeError(raw: unknown, method?: any): ApiError {
  const meta = method?.meta as ApiMethodMeta | undefined;
  const defaultDisplay = meta?.errorDisplay ?? 'toast';

  if (isAxiosError(raw)) {
    const status = raw.response?.status;
    const data = raw.response?.data;

    // 网络错误/超时
    if (!raw.response) {
      return new ApiError({
        code: raw.code === 'ECONNABORTED' ? 50002 : 50001,
        message: data?.msg ?? 'Network error or timeout',
        display: defaultDisplay,
      })
    }

    // 登录失效
    if (status === 401) {
      return new ApiError({
        code: data?.code ?? 20001,
        message: data?.msg ?? 'Login expired',
        httpStatus: 401,
        detail: data?.detail,
        display: 'silent',
      })
    }

    // 表单校验
    if (status === 422) {
      return new ApiError({
        code: data?.code ?? 50003,
        httpStatus: 422,
        message: data?.msg ?? 'Form validation failed',
        detail: data?.detail,
        fields: data?.detail?.fields,
        display: meta?.errorDisplay ?? 'form',
      })
    }

    // 其他业务 / HTTP 错误
    return new ApiError({
      code: data?.code ?? `HTTP_${status}`,
      message: data?.msg ?? 'Unknown error',
      httpStatus: status,
      detail: data?.detail,
      display: defaultDisplay,
    })
  }

  if (raw instanceof ApiError) {
    return raw
  }

  return new ApiError({
    code: 50404,
    display: defaultDisplay,
  })
}