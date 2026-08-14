import { oplearnClient } from './oplearnClient'
import type { ResponseGeneral, PageResponse, PoemResponse } from '@/types'

export const favoriteService = {
  /** Trạng thái yêu thích của bài thơ với user hiện tại (cần đăng nhập). */
  async status(poemId: number): Promise<boolean> {
    const res = await oplearnClient.get<ResponseGeneral<boolean>>(`/favorites/${poemId}/status`)
    return !!res.data.data
  },

  /** Thêm vào yêu thích; trả về true. */
  async add(poemId: number): Promise<boolean> {
    const res = await oplearnClient.post<ResponseGeneral<boolean>>(`/favorites/${poemId}`)
    return !!res.data.data
  },

  /** Bỏ yêu thích; trả về false. */
  async remove(poemId: number): Promise<boolean> {
    const res = await oplearnClient.delete<ResponseGeneral<boolean>>(`/favorites/${poemId}`)
    return !!res.data.data
  },

  /** Danh sách bài thơ đã thích của user hiện tại. */
  async myFavorites(params?: { page?: number; size?: number }): Promise<PageResponse<PoemResponse>> {
    const res = await oplearnClient.get<ResponseGeneral<PageResponse<PoemResponse>>>('/favorites', {
      params: { page: params?.page ?? 0, size: params?.size ?? 20 },
    })
    return res.data.data
  },
}
