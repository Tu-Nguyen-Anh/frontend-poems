import { oplearnClient } from './oplearnClient'
import { UserRole } from '@/types'
import type { ResponseGeneral, PageResponse, UserResponse } from '@/types'

export interface CreateUserPayload {
  username: string
  email: string
  password?: string
  phoneNumber?: string
  role?: UserRole | string
}

export interface UpdateUserPayload {
  username?: string
  email?: string
  phoneNumber?: string
  role?: UserRole | string
  /** Chỉ gửi khi muốn đổi mật khẩu; bỏ trống = giữ nguyên. */
  password?: string
}

export const userService = {
  async getUsers(params?: { keyword?: string; page?: number; size?: number; isAll?: boolean }): Promise<PageResponse<UserResponse>> {
    const res = await oplearnClient.get<ResponseGeneral<PageResponse<UserResponse>>>('/users', {
      params: {
        keyword: params?.keyword,
        page: params?.page ?? 0,
        size: params?.size ?? 10,
        isAll: params?.isAll ?? false,
      },
    })
    return res.data.data
  },

  async getUserById(id: number): Promise<UserResponse> {
    const res = await oplearnClient.get<ResponseGeneral<UserResponse>>(`/users/${id}`)
    return res.data.data
  },

  async createUser(data: CreateUserPayload): Promise<UserResponse> {
    const payload = {
      username: data.username,
      email: data.email,
      password: data.password,
      phone_number: data.phoneNumber ?? '',
      phoneNumber: data.phoneNumber ?? '',
      role: data.role,
    }
    const res = await oplearnClient.post<any>('/users', payload)
    return res.data?.data || res.data
  },

  async updateUser(id: number, data: UpdateUserPayload): Promise<UserResponse> {
    const payload: any = { ...data }
    if (data.phoneNumber !== undefined) {
      payload.phone_number = data.phoneNumber
      payload.phoneNumber = data.phoneNumber
    }
    const res = await oplearnClient.put<any>(`/users/${id}`, payload)
    return res.data?.data || res.data
  },

  async deleteUser(id: number): Promise<void> {
    await oplearnClient.delete(`/users/${id}`)
  },
}
