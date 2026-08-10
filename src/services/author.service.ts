import { oplearnClient } from './oplearnClient'
import type { ResponseGeneral, PageResponse, AuthorResponse, AuthorRequest, PoemResponse } from '@/types'

export const authorService = {
  async getAuthors(params?: { keyword?: string; page?: number; size?: number; isAll?: boolean }): Promise<PageResponse<AuthorResponse>> {
    const res = await oplearnClient.get<ResponseGeneral<PageResponse<AuthorResponse>>>('/authors', {
      params: {
        keyword: params?.keyword,
        page: params?.page ?? 0,
        size: params?.size ?? 10,
        isAll: params?.isAll ?? false,
      },
    })
    return res.data.data
  },

  async getAuthorById(id: number): Promise<AuthorResponse> {
    const res = await oplearnClient.get<ResponseGeneral<AuthorResponse>>(`/authors/${id}`)
    return res.data.data
  },

  async getPoemsByAuthor(authorId: number): Promise<PoemResponse[]> {
    const res = await oplearnClient.get<ResponseGeneral<PageResponse<PoemResponse> | PoemResponse[]>>(`/authors/${authorId}/poems`)
    const data = res.data.data
    if (Array.isArray(data)) return data
    if (data && Array.isArray((data as PageResponse<PoemResponse>).content)) {
      return (data as PageResponse<PoemResponse>).content
    }
    return []
  },

  async createAuthor(data: AuthorRequest): Promise<AuthorResponse> {
    const birthYear = data.birthYear ?? (data as any).birth_year ?? null
    const payload = {
      name: data.name,
      birthYear,
      birth_year: birthYear,
      hometown: data.hometown || null,
      achievement: data.achievement || null,
    }
    try {
      const res = await oplearnClient.post<any>('/authors', payload)
      return res.data?.data || res.data
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.response?.status === 405) {
        const res = await oplearnClient.post<any>('/admin/authors', payload)
        return res.data?.data || res.data
      }
      throw err
    }
  },

  async updateAuthor(id: number, data: AuthorRequest): Promise<AuthorResponse> {
    const birthYear = data.birthYear ?? (data as any).birth_year ?? null
    const payload = {
      name: data.name,
      birthYear,
      birth_year: birthYear,
      hometown: data.hometown || null,
      achievement: data.achievement || null,
    }
    try {
      const res = await oplearnClient.put<any>(`/authors/${id}`, payload)
      return res.data?.data || res.data
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.response?.status === 405) {
        const res = await oplearnClient.put<any>(`/admin/authors/${id}`, payload)
        return res.data?.data || res.data
      }
      throw err
    }
  },

  async deleteAuthor(id: number): Promise<void> {
    try {
      await oplearnClient.delete(`/authors/${id}`)
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.response?.status === 405) {
        await oplearnClient.delete(`/admin/authors/${id}`)
        return
      }
      throw err
    }
  },
}
