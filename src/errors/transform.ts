import type { FieldErrorItem } from "./apiError"

export function transformFieldError(fields: Record<string, FieldErrorItem[]>): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  for (const [field, errors] of Object.entries(fields)) {
    result[field] = errors.map(item => item.type)
  }
  return result
}