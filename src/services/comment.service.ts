import { oplearnClient } from './oplearnClient'
import type { PageResponse, CommentResponse, CommentRequest } from '@/types'

export const commentService = {
  async getCommentsByPoem(poemId: number, params?: { page?: number; size?: number }): Promise<PageResponse<CommentResponse>> {
    try {
      const res = await oplearnClient.get<any>(`/comments/poem/${poemId}`, {
        params: {
          page: params?.page ?? 0,
          size: params?.size ?? 50,
        },
      })
      const data = res.data?.data || res.data
      if (data && Array.isArray(data.content)) return data
      if (Array.isArray(data)) return { content: data, amount: data.length }
      return { content: [], amount: 0 }
    } catch {
      try {
        const res = await oplearnClient.get<any>(`/poems/${poemId}/comments`, {
          params: { page: params?.page ?? 0, size: params?.size ?? 50 },
        })
        const data = res.data?.data || res.data
        if (data && Array.isArray(data.content)) return data
        if (Array.isArray(data)) return { content: data, amount: data.length }
        return { content: [], amount: 0 }
      } catch {
        const res = await oplearnClient.get<any>('/comments', {
          params: { poemId, page: params?.page ?? 0, size: params?.size ?? 50 },
        })
        const data = res.data?.data || res.data
        if (data && Array.isArray(data.content)) return data
        if (Array.isArray(data)) return { content: data, amount: data.length }
        return { content: [], amount: 0 }
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
