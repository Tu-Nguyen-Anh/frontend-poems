import { isAxiosError } from 'axios'

const ERROR_TRANSLATIONS: Record<string, string> = {
  'invalid username or password': 'Tên đăng nhập hoặc mật khẩu không chính xác.',
  'invalid otp code': 'Mã OTP không chính xác. Vui lòng kiểm tra lại.',
  'otp code has expired or does not exist': 'Mã OTP đã hết hạn hoặc không tồn tại. Vui lòng yêu cầu gửi lại mã mới.',
  'user not found': 'Không tìm thấy tài khoản với thông tin này.',
  'username already exists': 'Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.',
  'email already exists': 'Email đã được sử dụng bởi tài khoản khác.',
  'password must be at least 8 characters': 'Mật khẩu phải có ít nhất 8 ký tự.',
  'email is invalid': 'Địa chỉ email không hợp lệ.',
  'refresh token is invalid or expired': 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  'auth.email.not_blank': 'Email không được để trống.',
  'auth.email.invalid': 'Địa chỉ email không hợp lệ.',
  'auth.email.not_found': 'Không tìm thấy tài khoản với địa chỉ email này.',
  'auth.otp.not_blank': 'Mã OTP không được để trống.',
  'auth.otp.invalid': 'Mã OTP không chính xác. Vui lòng kiểm tra lại.',
  'auth.otp.expired': 'Mã OTP đã hết hạn hoặc không tồn tại. Vui lòng yêu cầu gửi lại mã mới.',
  'auth.user.not_found': 'Không tìm thấy tài khoản với thông tin này.',
  'auth.password.not_blank': 'Mật khẩu không được để trống.',
  'auth.new_password.not_blank': 'Mật khẩu mới không được để trống.',
  'auth.new_password.min_length': 'Mật khẩu mới phải có ít nhất 8 ký tự.',
  'user.new_password.not_blank': 'Mật khẩu mới không được để trống.',
  'user.new_password.min_length': 'Mật khẩu mới phải có ít nhất 8 ký tự.',
  'user.username.not_blank': 'Tên đăng nhập không được để trống.',
  'user.password.not_blank': 'Mật khẩu không được để trống.',
  'user.password.min_length': 'Mật khẩu phải có ít nhất 8 ký tự.',
  'user.email.invalid': 'Địa chỉ email không hợp lệ.',
  'user.email.not_blank': 'Email không được để trống.',
  'new_password.not_blank': 'Mật khẩu mới không được để trống.',
  'new_password.min_length': 'Mật khẩu mới phải có ít nhất 8 ký tự.',
  'email.not_blank': 'Email không được để trống.',
  'otp.not_blank': 'Mã OTP không được để trống.',
  'user_not_found': 'Không tìm thấy tài khoản với thông tin này.',
  'email_not_found': 'Không tìm thấy tài khoản với địa chỉ email này.',
  'email_already_exists': 'Email đã được sử dụng bởi tài khoản khác.',
  'username_already_exists': 'Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.',
  'invalid_otp': 'Mã OTP không chính xác. Vui lòng kiểm tra lại.',
  'invalid_otp_code': 'Mã OTP không chính xác. Vui lòng kiểm tra lại.',
  'otp_expired': 'Mã OTP đã hết hạn hoặc không tồn tại. Vui lòng yêu cầu gửi lại mã mới.',
  'otp_not_found': 'Mã OTP không tồn tại hoặc đã hết hạn.',
}

function translateMessage(raw: string): string {
  const clean = raw.trim()
  const lower = clean.toLowerCase()
  if (ERROR_TRANSLATIONS[lower]) return ERROR_TRANSLATIONS[lower]
  if (ERROR_TRANSLATIONS[clean]) return ERROR_TRANSLATIONS[clean]
  if (lower.includes('invalid username or password')) {
    return 'Tên đăng nhập hoặc mật khẩu không chính xác.'
  }
  if (lower.includes('invalid otp')) {
    return 'Mã OTP không chính xác. Vui lòng kiểm tra lại.'
  }
  if (lower.includes('otp') && (lower.includes('expired') || lower.includes('not exist') || lower.includes('not found'))) {
    return 'Mã OTP đã hết hạn hoặc không tồn tại. Vui lòng yêu cầu gửi lại mã mới.'
  }
  if (lower.includes('user not found') || lower.includes('email not found')) {
    return 'Không tìm thấy tài khoản với thông tin này.'
  }
  if (lower.includes('username already exist')) {
    return 'Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.'
  }
  if (lower.includes('email already exist')) {
    return 'Email đã được sử dụng bởi tài khoản khác.'
  }
  if (lower.includes('too many requests')) {
    return 'Bạn đang thao tác quá nhanh. Vui lòng thử lại sau 1 phút (tối đa 5 lượt/phút).'
  }
  return clean
}

/** Lấy thông điệp lỗi chính xác từ backend (ResponseGeneral / Axios Error / Error object) */
export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const status = error.response?.status
    const resData = error.response?.data as any
    if (resData && typeof resData === 'object') {
      // ResponseGeneral lỗi: message thật nằm ở data.detail (Error{code,detail});
      if (resData.data?.detail && typeof resData.data.detail === 'string') {
        return translateMessage(resData.data.detail)
      }
      if (resData.data?.code && typeof resData.data.code === 'string') {
        const tr = translateMessage(resData.data.code)
        if (tr !== resData.data.code) return tr
      }
      if (resData.data?.error_description && typeof resData.data.error_description === 'string') {
        return translateMessage(resData.data.error_description)
      }
      if (resData.data?.error_message && typeof resData.data.error_message === 'string') {
        return translateMessage(resData.data.error_message)
      }
      if (resData.data?.message && typeof resData.data.message === 'string') {
        return translateMessage(resData.data.message)
      }
      if (resData.error_description && typeof resData.error_description === 'string') {
        return translateMessage(resData.error_description)
      }
      if (resData.error_message && typeof resData.error_message === 'string') {
        return translateMessage(resData.error_message)
      }
      if (resData.message && typeof resData.message === 'string') {
        const tr = translateMessage(resData.message)
        if (tr !== resData.message && !resData.message.includes('Request')) return tr
      }
      if (resData.error && typeof resData.error === 'string') return translateMessage(resData.error)
      if (Array.isArray(resData.errors)) return resData.errors.map((e) => translateMessage(String(e))).join(', ')
      if (resData.errors && typeof resData.errors === 'object') {
        return Object.entries(resData.errors)
          .map(([k, v]) => `${k}: ${translateMessage(String(v))}`)
          .join('; ')
      }
      if (typeof resData.data === 'string') return translateMessage(resData.data)
      if (resData.data && (resData.data as any).detail) return translateMessage(String((resData.data as any).detail))
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

