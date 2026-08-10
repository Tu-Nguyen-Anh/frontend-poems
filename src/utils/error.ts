import { isAxiosError } from 'axios'
import type { ResponseGeneral } from '@/types'

/** Lấy thông điệp lỗi chính xác từ backend (ResponseGeneral / Axios Error / Error object) */
export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const status = error.response?.status
    const resData = error.response?.data as any
    if (resData && typeof resData === 'object') {
      if (resData.message) return resData.message
      if (resData.error && typeof resData.error === 'string') return resData.error
      if (Array.isArray(resData.errors)) return resData.errors.join(', ')
      if (resData.errors && typeof resData.errors === 'object') {
        return Object.entries(resData.errors).map(([k, v]) => `${k}: ${v}`).join('; ')
      }
      if (typeof resData.data === 'string') return resData.data
      if (resData.data && (resData.data as any).detail) return (resData.data as any).detail
    }
    if (typeof resData === 'string') return resData
    if (status === 401) return 'Phiên đăng nhập hết hạn hoặc không tìm thấy Bearer Token (401).'
    if (status === 403) return 'Tài khoản không có quyền Admin để thực hiện thao tác này (403).'
    if (status === 404) return `API backend không tồn tại (404: ${error.config?.url}).`
    if (status === 500) return 'Lỗi hệ thống máy chủ backend (500).'
    return error.message || 'Lỗi kết nối máy chủ.'
  }
  if (error instanceof Error) return error.message
  return 'Đã có lỗi xảy ra, vui lòng thử lại sau.'
}
