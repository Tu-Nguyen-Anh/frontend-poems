import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/config/env'
import { HTTP_STATUS } from '@/constants'
import { PATHS } from '@/routes/paths'
import type { ResponseGeneral, TokenResponse } from '@/types'
import { tokenStorage } from './tokenStorage'

export const oplearnClient = axios.create({
  baseURL: env.OPLEARN_API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json', 'Accept-Language': 'vi' },
})

oplearnClient.interceptors.request.use((config) => {
  const accessToken = tokenStorage.getAccessToken()
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStorage.getRefreshToken()
  if (!refreshToken) throw new Error('Chưa đăng nhập hoặc không tìm thấy refresh token')

  // Backend dùng Jackson SNAKE_CASE nên gửi cả refresh_token và refreshToken để tương thích 100%
  const res = await axios.post<any>(
    `${env.OPLEARN_API_URL}/auth/refresh`,
    {
      refresh_token: refreshToken,
      refreshToken: refreshToken,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'vi',
      },
    },
  )

  const tokenData = res.data?.data ?? res.data
  if (!tokenData) {
    throw new Error('Dữ liệu phản hồi token không hợp lệ')
  }

  tokenStorage.saveTokens(tokenData)

  const newAccessToken =
    tokenData.accessToken ||
    tokenData.access_token ||
    tokenData.token ||
    tokenData.data?.accessToken ||
    tokenData.data?.access_token

  if (!newAccessToken) {
    throw new Error('Không trích xuất được access token mới')
  }

  return newAccessToken
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

    const currentRefreshToken = tokenStorage.getRefreshToken()
    if (!currentRefreshToken) {
      throw error
    }

    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null
      })
      const accessToken = await refreshPromise
      if (config.headers) {
        config.headers.Authorization = `Bearer ${accessToken}`
        config.headers['Authorization'] = `Bearer ${accessToken}`
      }
      return oplearnClient(config)
    } catch (refreshError) {
      console.warn('Làm mới access token thất bại, chuyển hướng đăng nhập:', refreshError)
      tokenStorage.clear()
      window.location.href = PATHS.LOGIN
      throw refreshError
    }
  },
)
