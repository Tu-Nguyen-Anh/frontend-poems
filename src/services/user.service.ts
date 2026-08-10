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
    const res = await oplearnClient.post<ResponseGeneral<UserResponse>>('/users', data)
    return res.data.data
  },

  async updateUser(id: number, data: UpdateUserPayload): Promise<UserResponse> {
    const res = await oplearnClient.put<ResponseGeneral<UserResponse>>(`/users/${id}`, data)
    return res.data.data
  },

  async deleteUser(id: number): Promise<void> {
    await oplearnClient.delete(`/users/${id}`)
  },
}
