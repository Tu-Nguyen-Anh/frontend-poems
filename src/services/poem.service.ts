import { oplearnClient } from './oplearnClient'
import type { ResponseGeneral, PageResponse, PoemResponse, PoemRequest } from '@/types'

export const poemService = {
  async getPoems(params?: { keyword?: string; page?: number; size?: number }): Promise<PageResponse<PoemResponse>> {
    const res = await oplearnClient.get<ResponseGeneral<PageResponse<PoemResponse>>>('/poems', {
      params: {
        keyword: params?.keyword,
        page: params?.page ?? 0,
        size: params?.size ?? 10,
      },
    })
    return res.data.data
  },

  async getPoemById(id: number): Promise<PoemResponse> {
    const res = await oplearnClient.get<ResponseGeneral<PoemResponse>>(`/poems/${id}`)
    return res.data.data
  },

  async getLatestPoems(params?: { page?: number; size?: number }): Promise<PageResponse<PoemResponse>> {
    const res = await oplearnClient.get<ResponseGeneral<PageResponse<PoemResponse>>>('/poems/latest', {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 10,
      },
    })
    return res.data.data
  },

  async getRandomPoems(): Promise<PoemResponse[]> {
    const res = await oplearnClient.get<ResponseGeneral<PoemResponse[]>>('/poems/random')
    return res.data.data
  },

  async createPoem(data: PoemRequest): Promise<PoemResponse> {
    const authorId = data.authorId ?? (data as any).author_id ?? null
    const genreId = data.genreId ?? (data as any).genre_id ?? null
    const payload: any = {
      name: data.name,
      description: data.description || null,
      year: data.year || null,
      content: data.content,
      transliteration: data.transliteration || null,
      translation: data.translation || null,
      language: data.language || 'vi',
      authorId,
      author_id: authorId,
      genreId,
      genre_id: genreId,
    }
    if (authorId) payload.author = { id: authorId }
    if (genreId) payload.genre = { id: genreId }

    try {
      const res = await oplearnClient.post<any>('/poems', payload)
      return res.data?.data || res.data
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.response?.status === 405) {
        const res = await oplearnClient.post<any>('/admin/poems', payload)
        return res.data?.data || res.data
      }
      throw err
    }
  },

  async updatePoem(id: number, data: PoemRequest): Promise<PoemResponse> {
    const authorId = data.authorId ?? (data as any).author_id ?? null
    const genreId = data.genreId ?? (data as any).genre_id ?? null
    const payload: any = {
      name: data.name,
      description: data.description || null,
      year: data.year || null,
      content: data.content,
      transliteration: data.transliteration || null,
      translation: data.translation || null,
      language: data.language || 'vi',
      authorId,
      author_id: authorId,
      genreId,
      genre_id: genreId,
    }
    if (authorId) payload.author = { id: authorId }
    if (genreId) payload.genre = { id: genreId }

    try {
      const res = await oplearnClient.put<any>(`/poems/${id}`, payload)
      return res.data?.data || res.data
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.response?.status === 405) {
        const res = await oplearnClient.put<any>(`/admin/poems/${id}`, payload)
        return res.data?.data || res.data
      }
      throw err
    }
  },

  async deletePoem(id: number): Promise<void> {
    try {
      await oplearnClient.delete(`/poems/${id}`)
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.response?.status === 405) {
        await oplearnClient.delete(`/admin/poems/${id}`)
        return
      }
      throw err
    }
  },
}
