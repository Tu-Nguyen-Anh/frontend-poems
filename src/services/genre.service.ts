import { oplearnClient } from './oplearnClient'
import type { ResponseGeneral, PageResponse, GenreResponse, GenreRequest, PoemResponse } from '@/types'

export const genreService = {
  async getGenres(params?: { keyword?: string; page?: number; size?: number; isAll?: boolean }): Promise<PageResponse<GenreResponse>> {
    const res = await oplearnClient.get<ResponseGeneral<PageResponse<GenreResponse>>>('/genres', {
      params: {
        keyword: params?.keyword,
        page: params?.page ?? 0,
        size: params?.size ?? 10,
        isAll: params?.isAll ?? false,
      },
    })
    return res.data.data
  },

  async getGenreById(id: number): Promise<GenreResponse> {
    const res = await oplearnClient.get<ResponseGeneral<GenreResponse>>(`/genres/${id}`)
    return res.data.data
  },

  async getPoemsByGenre(genreId: number): Promise<PoemResponse[]> {
    const res = await oplearnClient.get<ResponseGeneral<PageResponse<PoemResponse> | PoemResponse[]>>(`/genres/${genreId}/poems`)
    const data = res.data.data
    if (Array.isArray(data)) return data
    if (data && Array.isArray((data as PageResponse<PoemResponse>).content)) {
      return (data as PageResponse<PoemResponse>).content
    }
    return []
  },

  async createGenre(data: GenreRequest): Promise<GenreResponse> {
    try {
      const res = await oplearnClient.post<any>('/genres', data)
      return res.data?.data || res.data
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.response?.status === 405) {
        const res = await oplearnClient.post<any>('/admin/genres', data)
        return res.data?.data || res.data
      }
      throw err
    }
  },

  async updateGenre(id: number, data: GenreRequest): Promise<GenreResponse> {
    try {
      const res = await oplearnClient.put<any>(`/genres/${id}`, data)
      return res.data?.data || res.data
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.response?.status === 405) {
        const res = await oplearnClient.put<any>(`/admin/genres/${id}`, data)
        return res.data?.data || res.data
      }
      throw err
    }
  },

  async deleteGenre(id: number): Promise<void> {
    try {
      await oplearnClient.delete(`/genres/${id}`)
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.response?.status === 405) {
        await oplearnClient.delete(`/admin/genres/${id}`)
        return
      }
      throw err
    }
  },
}
