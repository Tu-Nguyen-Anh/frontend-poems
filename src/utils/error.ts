import { isAxiosError } from 'axios'

interface ApiErrorBody {
  message?: string
  data?: { detail?: string }
}

/** Lấy message dễ đọc từ mọi loại error (axios, Error, unknown). */
export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined
    return body?.data?.detail ?? body?.message ?? error.message
  }
  if (error instanceof Error) return error.message
  return 'Đã có lỗi xảy ra, vui lòng thử lại.'
}
