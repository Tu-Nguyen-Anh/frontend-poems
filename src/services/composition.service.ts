import { oplearnClient } from './oplearnClient'
import type { PoemCompositionRequest, PoemCompositionResponse, ResponseGeneral } from '@/types'

function extractPageData(data: any): { content: PoemCompositionResponse[]; totalElements: number } {
  if (!data) return { content: [], totalElements: 0 }
  const content = Array.isArray(data.content)
    ? data.content
    : Array.isArray(data.data)
      ? data.data
      : Array.isArray(data)
        ? data
        : []
  const totalElements =
    data.total_elements ??
    data.totalElements ??
    data.amount ??
    content.length
  return { content, totalElements }
}

export const compositionService = {
  /**
   * Lấy danh sách bài thơ sáng tác MỚI NHẤT (hỗ trợ Infinite Scroll / phân trang)
   */
  async getLatest(page = 0, size = 10): Promise<{ content: PoemCompositionResponse[]; totalElements: number }> {
    const res = await oplearnClient.get<ResponseGeneral<any>>('/compositions/latest', {
      params: { page, size },
    })
    const data = res.data?.data || res.data
    return extractPageData(data)
  },

  /**
   * Lấy danh sách 10 bài thơ ngẫu nhiên để người dùng khám phá
   */
  async getRandom(): Promise<{ content: PoemCompositionResponse[]; totalElements: number }> {
    const res = await oplearnClient.get<ResponseGeneral<any>>('/compositions/random')
    const data = res.data?.data || res.data
    return extractPageData(data)
  },

  /**
   * Xem chi tiết bài thơ tự sáng tác
   */
  async getById(id: number): Promise<PoemCompositionResponse> {
    const res = await oplearnClient.get<ResponseGeneral<PoemCompositionResponse>>(`/compositions/${id}`)
    return res.data?.data || (res.data as unknown as PoemCompositionResponse)
  },

  /**
   * Đăng bài thơ tự sáng tác mới (Rate limit: tối đa 5 bài/24h)
   */
  async create(data: PoemCompositionRequest): Promise<PoemCompositionResponse> {
    const payload = {
      title: data.title,
      content: data.content,
      pen_name: data.penName ?? data.pen_name ?? '',
      penName: data.penName ?? data.pen_name ?? '',
      genre_id: data.genreId ?? data.genre_id,
      genreId: data.genreId ?? data.genre_id,
      status: data.status || 'PUBLISHED',
    }
    const res = await oplearnClient.post<ResponseGeneral<PoemCompositionResponse>>('/compositions', payload)
    return res.data?.data || (res.data as unknown as PoemCompositionResponse)
  },

  /**
   * Chỉnh sửa bài thơ tự sáng tác (chỉ tác giả)
   */
  async update(id: number, data: PoemCompositionRequest): Promise<PoemCompositionResponse> {
    const payload = {
      title: data.title,
      content: data.content,
      pen_name: data.penName ?? data.pen_name ?? '',
      penName: data.penName ?? data.pen_name ?? '',
      genre_id: data.genreId ?? data.genre_id,
      genreId: data.genreId ?? data.genre_id,
      status: data.status || 'PUBLISHED',
    }
    const res = await oplearnClient.put<ResponseGeneral<PoemCompositionResponse>>(`/compositions/${id}`, payload)
    return res.data?.data || (res.data as unknown as PoemCompositionResponse)
  },

  /**
   * Xoá bài thơ tự sáng tác (chủ bài viết hoặc Admin)
   */
  async delete(id: number): Promise<void> {
    await oplearnClient.delete(`/compositions/${id}`)
  },

  /**
   * Danh sách bài thơ của một User (Trang cá nhân)
   */
  async getByUser(
    userId: number,
    page = 0,
    size = 10,
  ): Promise<{ content: PoemCompositionResponse[]; totalElements: number }> {
    const res = await oplearnClient.get<ResponseGeneral<any>>(`/compositions/user/${userId}`, {
      params: { page, size },
    })
    const data = res.data?.data || res.data
    return extractPageData(data)
  },

  /**
   * Tìm kiếm bài thơ sáng tác theo keyword và genreId
   */
  async search(params: {
    keyword?: string
    genreId?: number
    page?: number
    size?: number
  }): Promise<{ content: PoemCompositionResponse[]; totalElements: number }> {
    const queryParams: Record<string, any> = {
      page: params.page ?? 0,
      size: params.size ?? 10,
    }
    if (params.keyword?.trim()) queryParams.keyword = params.keyword.trim()
    if (params.genreId) queryParams.genreId = params.genreId

    const res = await oplearnClient.get<ResponseGeneral<any>>('/compositions/search', {
      params: queryParams,
    })
    const data = res.data?.data || res.data
    return extractPageData(data)
  },
}
