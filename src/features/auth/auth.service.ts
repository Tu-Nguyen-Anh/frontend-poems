import type { ResponseGeneral, TokenResponse } from '@/services/api.types'
import { oplearnClient } from '@/services/oplearnClient'
import { tokenStorage } from '@/services/tokenStorage'
import type { LoginRequest } from './types'

/** Không kế thừa OplearnBaseService vì auth không phải resource CRUD. */
class AuthService {
  async login(payload: LoginRequest): Promise<TokenResponse> {
    const { data } = await oplearnClient.post<ResponseGeneral<TokenResponse>>(
      '/auth/login',
      payload,
    )
    tokenStorage.save(data.data)
    return data.data
  }

  /** Thu hồi refresh token phía server rồi xoá phiên local dù thành công hay không. */
  async logout(): Promise<void> {
    const refreshToken = tokenStorage.getRefreshToken()
    try {
      if (refreshToken) {
        await oplearnClient.post('/auth/logout', { refresh_token: refreshToken })
      }
    } finally {
      tokenStorage.clear()
    }
  }
}

export const authService = new AuthService()
