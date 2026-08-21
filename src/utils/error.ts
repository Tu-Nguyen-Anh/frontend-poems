import { isAxiosError } from 'axios'

/** Lấy thông điệp lỗi chính xác từ backend (ResponseGeneral / Axios Error / Error object) */
export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const status = error.response?.status
    const resData = error.response?.data as any
    if (resData && typeof resData === 'object') {
      // ResponseGeneral lỗi: message thật nằm ở data.detail (Error{code,detail});
      // resData.message chỉ là reason phrase chung chung ("Bad Request"…) nên xét sau.
      if (resData.data?.detail && typeof resData.data.detail === 'string') {
        if (resData.data.detail === 'Invalid username or password') {
          return 'Tên đăng nhập hoặc mật khẩu không chính xác.'
        }
        if (resData.data.detail.toLowerCase().includes('too many requests')) {
          return 'Bạn đang thao tác quá nhanh. Vui lòng thử lại sau 1 phút (tối đa 5 lượt/phút).'
        }
        return resData.data.detail
      }
      if (resData.data?.message && typeof resData.data.message === 'string') {
        if (resData.data.message.toLowerCase().includes('too many requests')) {
          return 'Bạn đang thao tác quá nhanh. Vui lòng thử lại sau 1 phút (tối đa 5 lượt/phút).'
        }
        return resData.data.message
      }
      if (resData.message) {
        if (typeof resData.message === 'string' && resData.message.toLowerCase().includes('too many requests')) {
          return 'Bạn đang thao tác quá nhanh. Vui lòng thử lại sau 1 phút (tối đa 5 lượt/phút).'
        }
        return resData.message
      }
      if (resData.error && typeof resData.error === 'string') return resData.error
      if (Array.isArray(resData.errors)) return resData.errors.join(', ')
      if (resData.errors && typeof resData.errors === 'object') {
        return Object.entries(resData.errors).map(([k, v]) => `${k}: ${v}`).join('; ')
      }
      if (typeof resData.data === 'string') return resData.data
      if (resData.data && (resData.data as any).detail) return (resData.data as any).detail
    }
    if (typeof resData === 'string') return resData
    if (status === 401) return 'Tên đăng nhập hoặc mật khẩu không chính xác (401).'
    if (status === 403) return 'Tài khoản không có quyền Admin để thực hiện thao tác này (403).'
    if (status === 404) return `API backend không tồn tại (404: ${error.config?.url}).`
    if (status === 500) return 'Lỗi hệ thống máy chủ backend (500).'
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      return 'Không thể kết nối đến máy chủ backend (Network Error). Vui lòng kiểm tra backend có đang chạy không.'
    }
    return error.message || 'Lỗi kết nối máy chủ.'
  }
  if (error instanceof Error) return error.message
  return 'Đã có lỗi xảy ra, vui lòng thử lại sau.'
}

