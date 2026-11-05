export type ErrorDisplay = 'toast' | 'page' | 'form' | 'silent' | 'report'

export interface FieldErrorItem {
  type: string
  msg?: string
}

export interface ApiMethodMeta {
  errorDisplay?: ErrorDisplay
}

export class ApiError extends Error {
  code: number
  httpStatus?: number
  message: string = ''
  detail?: any
  fields?: Record<string, FieldErrorItem[]>
  display: ErrorDisplay
  handleByGlobal: boolean = false

  constructor(options: {
    code: number
    httpStatus?: number
    message?: string
    detail?: any
    fields?: Record<string, FieldErrorItem[]>
    display: ErrorDisplay
  }) {
    super(String(options.code))
    this.name = 'ApiError'
    this.code = options.code
    this.message = options.message ?? ''
    this.httpStatus = options.httpStatus
    this.detail = options.detail
    this.fields = options.fields
    this.display = options.display ?? 'toast'
  }
}
