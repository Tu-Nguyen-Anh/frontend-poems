import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/config/env'
import { HTTP_STATUS } from '@/constants'
import { decodeJwt } from '@/utils/jwt'
import { tokenStorage } from './tokenStorage'

export const oplearnClient = axios.create({
  baseURL: env.OPLEARN_API_URL,
  timeout: 15000,
  // Gửi/nhận cookie refresh_token (HttpOnly) cross-origin. Refresh token KHÔNG
  // còn nằm ở localStorage → không có RT dùng chung để race/wipe giữa các tab.
  withCredentials: true,
  headers: { 'Content-Type': 'application/json', 'Accept-Language': 'vi' },
})

/**
 * Phiên đã xác nhận chết (refresh fail) CHƯA báo? Chặn storm: khi 401 hàng loạt
 * (hay gặp lúc backend restart / token bị thu hồi), N request cùng fail chỉ báo
 * hết-phiên MỘT lần thay vì N lần → tránh xoá-nạp-lại-rồi-401 lặp vô tận.
 * Reset khi refresh thành công hoặc đăng nhập lại.
 */
let sessionExpiredNotified = false
export function resetSessionExpired(): void {
  sessionExpiredNotified = false
}

/** Access token đã (sắp) hết hạn? Đọc claim exp; skew 5s để refresh sớm 1 nhịp.
 *  Lỗi decode / không có exp → coi như CHƯA hết hạn (để backend quyết). */
function isAccessTokenExpired(token: string): boolean {
  const claims = decodeJwt(token)
  if (!claims || typeof claims.exp !== 'number') return false
  return claims.exp * 1000 <= Date.now() + 5000
}

let refreshPromise: Promise<boolean> | null = null

/**
 * Làm mới access token qua refresh token trong cookie HttpOnly. Trả true nếu
 * thành công (access token mới đã lưu). Concurrent 401s share cùng 1 lần gọi.
 */
async function attemptRefresh(): Promise<boolean> {
  if (sessionExpiredNotified) return false
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    // Refresh token ở cookie HttpOnly → withCredentials tự gửi kèm. Body chỉ
    // mang token CŨ ở localStorage (nếu còn) cho lần migrate đầu: BE ưu tiên cookie.
    const legacy = tokenStorage.getRefreshToken()
    try {
      const res = await axios.post<any>(
        `${env.OPLEARN_API_URL}/auth/refresh`,
        legacy ? { refresh_token: legacy, refreshToken: legacy } : {},
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json', 'Accept-Language': 'vi' },
        },
      )
      const tokenData = res.data?.data ?? res.data
      const newAccessToken =
        tokenData?.accessToken || tokenData?.access_token || tokenData?.token
      if (!newAccessToken) return false
      tokenStorage.saveTokens(tokenData) // lưu access mới (refresh giờ ở cookie)
      tokenStorage.removeRefreshToken() // dọn RT cũ khỏi localStorage sau migrate
      sessionExpiredNotified = false
      return true
    } catch {
      return false
    }
  })()
  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

// Gắn Bearer; refresh CHỦ ĐỘNG nếu access token đã hết hạn (giảm số 401 & race).
oplearnClient.interceptors.request.use(async (config) => {
  const url = config.url ?? ''
  const isAuthEndpoint = url.includes('/auth/')
  const token = tokenStorage.getAccessToken()
  if (token && !isAuthEndpoint && isAccessTokenExpired(token)) {
    await attemptRefresh()
  }
  const fresh = tokenStorage.getAccessToken()
  if (fresh && config.headers) {
    config.headers.Authorization = `Bearer ${fresh}`
  }
  return config
})

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean
}

oplearnClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined
    const isAuthEndpoint = config?.url?.includes('/auth/') ?? false

    if (error.response?.status !== HTTP_STATUS.UNAUTHORIZED || !config || config._retried || isAuthEndpoint) {
      throw error
    }

    config._retried = true
    const tokenUsed = config.headers?.Authorization

    const ok = await attemptRefresh()
    if (ok) {
      const token = tokenStorage.getAccessToken()
      if (token && config.headers) config.headers.Authorization = `Bearer ${token}`
      return oplearnClient(config)
    }

    // Refresh fail trong tab này — có thể tab KHÁC vừa refresh (rotate) và đã
    // ghi access token mới vào localStorage dùng chung. Nếu token đã đổi so với
    // token vừa dùng → retry với token mới, KHÔNG đá user ra.
    const current = tokenStorage.getAccessToken()
    if (current && `Bearer ${current}` !== tokenUsed) {
      if (config.headers) config.headers.Authorization = `Bearer ${current}`
      return oplearnClient(config)
    }

    // Phiên thực sự hết hạn → dọn access token + user, báo MỘT lần cho AuthProvider
    // (điều hướng SPA qua ProtectedRoute). KHÔNG reload cứng window.location.
    if (!sessionExpiredNotified) {
      sessionExpiredNotified = true
      tokenStorage.clear()
      try {
        window.dispatchEvent(new Event('poems-session-expired'))
      } catch {
        /* SSR/không có window */
      }
    }
    throw error
  },
)
