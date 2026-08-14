import { oplearnClient } from './oplearnClient'
import type { TokenResponse, LoginRequest, RegisterRequest } from '@/types'
import { tokenStorage } from './tokenStorage'

export const authService = {
  async login(payload: LoginRequest): Promise<TokenResponse> {
    const res = await oplearnClient.post<any>('/auth/login', payload)
    const tokenData = res.data?.data || res.data
    tokenStorage.saveTokens(tokenData)
    return tokenData
  },

  async register(payload: RegisterRequest): Promise<TokenResponse> {
    // Backend dùng Jackson SNAKE_CASE toàn cục nên phải gửi `phone_number`
    // (gửi `phoneNumber` sẽ không bind → phone_number NULL → vi phạm NOT NULL → 409).
    const body = {
      username: payload.username,
      email: payload.email,
      password: payload.password,
      phone_number: payload.phoneNumber ?? '',
    }
    const res = await oplearnClient.post<any>('/auth/register', body)
    const tokenData = res.data?.data || res.data
    tokenStorage.saveTokens(tokenData)
    return tokenData
  },

  async logout(): Promise<void> {
    const refreshToken = tokenStorage.getRefreshToken()
    if (refreshToken) {
      try {
        await oplearnClient.post('/auth/logout', { refreshToken })
      } catch (err) {
        console.error('Logout request failed', err)
      }
    }
    tokenStorage.clear()
  },
}
