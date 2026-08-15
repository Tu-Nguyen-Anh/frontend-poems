import { oplearnClient } from './oplearnClient'
import type { PageResponse, CursorPageResponse, CommentResponse, CommentRequest } from '@/types'

export const commentService = {
  async getCommentsByPoem(
    poemId: number,
    params?: { cursor?: number | null; size?: number }
  ): Promise<CursorPageResponse<CommentResponse>> {
    const queryParams: Record<string, any> = {
      size: params?.size ?? 10,
    }
    if (params?.cursor !== undefined && params?.cursor !== null) {
      queryParams.cursor = params.cursor
    }

    try {
      const res = await oplearnClient.get<any>(`/comments/poem/${poemId}`, {
        params: queryParams,
      })
      const data = res.data?.data || res.data
      if (data && typeof data === 'object') {
        const content = Array.isArray(data.content) ? data.content : Array.isArray(data) ? data : []
        const nextCursor = data.next_cursor ?? data.nextCursor ?? null
        const hasNext = Boolean(data.has_next ?? data.hasNext ?? (nextCursor !== null && nextCursor !== undefined))
        const totalElements = data.total_elements ?? data.totalElements ?? null

        return {
          content,
          next_cursor: nextCursor,
          nextCursor,
          has_next: hasNext,
          hasNext,
          total_elements: totalElements,
          totalElements,
        }
      }
      return {
        content: [],
        next_cursor: null,
        nextCursor: null,
        has_next: false,
        hasNext: false,
        total_elements: 0,
        totalElements: 0,
      }
    } catch {
      try {
        const res = await oplearnClient.get<any>(`/poems/${poemId}/comments`, {
          params: queryParams,
        })
        const data = res.data?.data || res.data
        const content = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : []
        return {
          content,
          next_cursor: data?.next_cursor ?? data?.nextCursor ?? null,
          has_next: Boolean(data?.has_next ?? data?.hasNext),
          total_elements: data?.total_elements ?? data?.totalElements ?? content.length,
        }
      } catch {
        const res = await oplearnClient.get<any>('/comments', {
          params: { poemId, ...queryParams },
        })
        const data = res.data?.data || res.data
        const content = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : []
        return {
          content,
          next_cursor: data?.next_cursor ?? data?.nextCursor ?? null,
          has_next: Boolean(data?.has_next ?? data?.hasNext),
          total_elements: data?.total_elements ?? data?.totalElements ?? content.length,
        }
      }
    }
  },

  async getCommentsByUser(userId: number, params?: { page?: number; size?: number }): Promise<PageResponse<CommentResponse>> {
    const res = await oplearnClient.get<any>(`/comments/user/${userId}`, {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 50,
      },
    })
    const data = res.data?.data || res.data
    if (data && Array.isArray(data.content)) return data
    if (Array.isArray(data)) return { content: data, amount: data.length }
    return { content: [], amount: 0 }
  },

  async getCommentById(id: number): Promise<CommentResponse> {
    const res = await oplearnClient.get<any>(`/comments/${id}`)
    return res.data?.data || res.data
  },

  async createComment(data: CommentRequest): Promise<CommentResponse> {
    const poemId = data.poemId ?? (data as any).poem_id
    const payload: any = {
      content: data.content,
      poemId,
      poem_id: poemId,
    }
    if (poemId) payload.poem = { id: poemId }

    try {
      const res = await oplearnClient.post<any>('/comments', payload, { params: { poemId, poem_id: poemId } })
      return res.data?.data || res.data
    } catch (err1: any) {
      try {
        const res = await oplearnClient.post<any>(`/comments/poem/${poemId}`, payload, { params: { poemId, poem_id: poemId } })
        return res.data?.data || res.data
      } catch (err2: any) {
        try {
          const res = await oplearnClient.post<any>(`/poems/${poemId}/comments`, payload, { params: { poemId, poem_id: poemId } })
          return res.data?.data || res.data
        } catch {
          throw err1
        }
      }
    }
  },

  async updateComment(id: number, content: string): Promise<CommentResponse> {
    const res = await oplearnClient.put<any>(`/comments/${id}`, { content })
    return res.data?.data || res.data
  },

  async deleteComment(id: number): Promise<void> {
    await oplearnClient.delete(`/comments/${id}`)
  },
}
