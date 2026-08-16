import { oplearnClient } from './oplearnClient'
import type { ResponseGeneral, PageResponse, PoemResponse, PoemRequest, FacetItem, RandomPoemsParams } from '@/types'

/** Đường dẫn duyệt phân cấp: chiều nào chưa chọn thì bỏ trống. */
export interface BrowsePath {
  language?: string
  era?: string
  genreId?: number
  authorId?: number
  keyword?: string
}

export const poemService = {
  /**
   * Nhánh con của cây duyệt phân cấp theo đường dẫn đã cho. Backend tự chọn cấp:
   * rỗng → ngôn ngữ; có language → thời kỳ; +era → thể thơ; +genreId → tác giả.
   */
  async getFacets(path: { language?: string; era?: string; genreId?: number }): Promise<FacetItem[]> {
    const res = await oplearnClient.get<ResponseGeneral<FacetItem[]>>('/poems/facets', {
      params: { language: path.language, era: path.era, genreId: path.genreId },
    })
    return res.data.data || []
  },

  /** Danh sách bài ở cấp lá theo đường dẫn duyệt (ngôn ngữ/thời kỳ/thể thơ/tác giả). */
  async browsePoems(path: BrowsePath & { page?: number; size?: number }): Promise<PageResponse<PoemResponse>> {
    const res = await oplearnClient.get<ResponseGeneral<PageResponse<PoemResponse>>>('/poems/browse', {
      params: {
        language: path.language,
        era: path.era,
        genreId: path.genreId,
        authorId: path.authorId,
        keyword: path.keyword,
        page: path.page ?? 0,
        size: path.size ?? 30,
      },
    })
    return res.data.data
  },

  async getPoems(params?: { keyword?: string; genreId?: number; era?: string; language?: string; page?: number; size?: number }): Promise<PageResponse<PoemResponse>> {
    const res = await oplearnClient.get<ResponseGeneral<PageResponse<PoemResponse>>>('/poems', {
      params: {
        keyword: params?.keyword,
        genreId: params?.genreId,
        era: params?.era,
        language: params?.language,
        page: params?.page ?? 0,
        size: params?.size ?? 10,
      },
    })
    return res.data.data
  },

  async getEras(): Promise<string[]> {
    const res = await oplearnClient.get<ResponseGeneral<string[]>>('/poems/eras')
    return res.data.data || []
  },

  async getLanguages(): Promise<string[]> {
    const res = await oplearnClient.get<ResponseGeneral<string[]>>('/poems/languages')
    return res.data.data || []
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

  async getRandomPoems(params?: RandomPoemsParams): Promise<PoemResponse[]> {
    const queryParams = new URLSearchParams()
    if (params?.authorIds && params.authorIds.length > 0) {
      params.authorIds.slice(0, 3).forEach((id) => queryParams.append('authorIds', String(id)))
    }
    if (params?.genreIds && params.genreIds.length > 0) {
      params.genreIds.slice(0, 3).forEach((id) => queryParams.append('genreIds', String(id)))
    }
    if (params?.eras && params.eras.length > 0) {
      params.eras.slice(0, 3).forEach((era) => queryParams.append('eras', era))
    }

    const res = await oplearnClient.get<ResponseGeneral<PageResponse<PoemResponse> | PoemResponse[]>>('/poems/random', {
      params: queryParams,
    })
    const data = res.data?.data || res.data
    if (Array.isArray(data)) return data
    if (data && Array.isArray((data as PageResponse<PoemResponse>).content)) {
      return (data as PageResponse<PoemResponse>).content
    }
    return []
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
