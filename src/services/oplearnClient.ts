import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/config/env'
import { HTTP_STATUS } from '@/constants'
import { PATHS } from '@/routes/paths'
import type { ResponseGeneral, TokenResponse } from './api.types'
import { tokenStorage } from './tokenStorage'

/**
 * Axios instance cho backend oplearn:
 * - tự gắn Bearer access token vào mọi request
 * - gặp 401 → tự gọi refresh token rồi retry request 1 lần
 * - refresh thất bại → xoá phiên, chuyển về trang đăng nhập
 */
export const oplearnClient = axios.create({
  baseURL: env.OPLEARN_API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

oplearnClient.interceptors.request.use((config) => {
  const accessToken = tokenStorage.getAccessToken()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// Nhiều request 401 cùng lúc chỉ refresh 1 lần, các request còn lại chờ chung promise
let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStorage.getRefreshToken()
  if (!refreshToken) throw new Error('Chưa đăng nhập')

  // Dùng axios gốc để không đi qua interceptor này (tránh lặp vô hạn)
  const { data } = await axios.post<ResponseGeneral<TokenResponse>>(
    `${env.OPLEARN_API_URL}/auth/refresh`,
    { refresh_token: refreshToken },
  )
  tokenStorage.save(data.data)
  return data.data.access_token
}

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

    // Chưa từng đăng nhập (không có refresh token) → trả lỗi luôn cho trang
    // tự xử lý, KHÔNG redirect (tránh đá người dùng vãng lai về /login).
    if (!tokenStorage.getRefreshToken()) {
      throw error
    }

    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null
      })
      const accessToken = await refreshPromise
      config.headers.Authorization = `Bearer ${accessToken}`
      return oplearnClient(config)
    } catch (refreshError) {
      tokenStorage.clear()
      window.location.href = PATHS.LOGIN
      throw refreshError
    }
  },
)
