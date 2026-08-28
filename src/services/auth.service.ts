import { oplearnClient } from './oplearnClient'
import type {
  TokenResponse,
  LoginRequest,
  RegisterRequest,
  VerifyOtpRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '@/types'
import { tokenStorage } from './tokenStorage'

export const authService = {
  async login(payload: LoginRequest): Promise<TokenResponse> {
    const res = await oplearnClient.post<any>('/auth/login', payload)
    const tokenData = res.data?.data || res.data
    tokenStorage.saveTokens(tokenData)
    return tokenData
  },

  async register(payload: RegisterRequest): Promise<void> {
    // Gửi cả snake_case và camelCase để tương thích toàn diện với backend Jackson
    const body = {
      username: payload.username,
      email: payload.email,
      password: payload.password,
      phone_number: payload.phoneNumber ?? payload.phone_number ?? '',
      phoneNumber: payload.phoneNumber ?? payload.phone_number ?? '',
    }
    await oplearnClient.post<any>('/auth/register', body)
  },

  async verifyOtp(payload: VerifyOtpRequest): Promise<TokenResponse> {
    const res = await oplearnClient.post<any>('/auth/verify-otp', {
      email: payload.email,
      otp: payload.otp,
      otp_code: payload.otp_code ?? payload.otp,
      otpCode: payload.otpCode ?? payload.otp,
      code: payload.code ?? payload.otp,
    })
    const tokenData = res.data?.data || res.data
    tokenStorage.saveTokens(tokenData)
    return tokenData
  },

  async forgotPassword(payload: ForgotPasswordRequest): Promise<void> {
    await oplearnClient.post<any>('/auth/forgot-password', {
      email: payload.email,
      username: payload.username ?? payload.email,
    })
  },

  async resetPassword(payload: ResetPasswordRequest): Promise<void> {
    const newPwd = payload.newPassword || payload.new_password || payload.password || ''
    const confirmPwd = payload.confirmPassword || payload.confirm_password || newPwd
    await oplearnClient.post<any>('/auth/reset-password', {
      email: payload.email,
      otp: payload.otp,
      otp_code: payload.otp_code ?? payload.otp,
      otpCode: payload.otpCode ?? payload.otp,
      code: payload.code ?? payload.otp,
      new_password: newPwd,
      newPassword: newPwd,
      password: newPwd,
      confirm_password: confirmPwd,
      confirmPassword: confirmPwd,
    })
  },

  async loginWithGoogle(token: string): Promise<TokenResponse> {
    const res = await oplearnClient.post<any>('/auth/login/google', { token })
    const tokenData = res.data?.data || res.data
    tokenStorage.saveTokens(tokenData)
    return tokenData
  },

  async logout(): Promise<void> {
    // Refresh token nằm ở cookie HttpOnly (withCredentials tự gửi) → luôn gọi
    // endpoint để BE thu hồi token + xoá cookie. Kèm token cũ ở body nếu còn
    // sót trong localStorage (user chưa migrate).
    try {
      const legacy = tokenStorage.getRefreshToken()
      await oplearnClient.post(
        '/auth/logout',
        legacy ? { refresh_token: legacy, refreshToken: legacy } : {},
      )
    } catch (err) {
      console.error('Logout request failed', err)
    }
    tokenStorage.clear()
  },
}
