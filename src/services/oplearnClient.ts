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
  if (!refreshToken) throw new Error('Chưa đăng nhập')

  const { data } = await axios.post<ResponseGeneral<TokenResponse>>(
    `${env.OPLEARN_API_URL}/auth/refresh`,
    { refreshToken },
  )
  tokenStorage.saveTokens(data.data)
  return data.data.accessToken || (data.data as any).access_token
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

    if (!tokenStorage.getRefreshToken()) {
      throw error
    }

    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null
      })
      const accessToken = await refreshPromise
      if (config.headers) {
        config.headers.Authorization = `Bearer ${accessToken}`
      }
      return oplearnClient(config)
    } catch (refreshError) {
      tokenStorage.clear()
      window.location.href = PATHS.LOGIN
      throw refreshError
    }
  },
)
