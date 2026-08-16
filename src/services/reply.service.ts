import { oplearnClient } from './oplearnClient'
import type { ResponseGeneral, ReplyResponse, ReplyRequest, CursorPageResponse } from '@/types'

export const replyService = {
  async getRepliesByComment(commentId: number): Promise<ReplyResponse[]> {
    const res = await oplearnClient.get<ResponseGeneral<any>>(`/replies/comment/${commentId}`)
    const data = res.data?.data
    if (!data) return []
    if (Array.isArray(data)) return data
    if (data.replies && Array.isArray(data.replies.content)) return data.replies.content
    if (Array.isArray(data.content)) return data.content
    return []
  },

  async getRepliesByUser(
    userId: number,
    params?: { cursor?: number | null; size?: number }
  ): Promise<CursorPageResponse<ReplyResponse>> {
    const queryParams: Record<string, any> = {
      size: params?.size ?? 10,
    }
    if (params?.cursor !== undefined && params?.cursor !== null) {
      queryParams.cursor = params.cursor
    }

    const res = await oplearnClient.get<any>(`/replies/user/${userId}`, {
      params: queryParams,
    })
    const data = res.data?.data || res.data
    if (data && typeof data === 'object') {
      const content = Array.isArray(data.content) ? data.content : Array.isArray(data) ? data : []
      const nextCursor = data.next_cursor ?? data.nextCursor ?? null
      const hasNext = Boolean(data.has_next ?? data.hasNext ?? (nextCursor !== null && nextCursor !== undefined))
      const totalElements = data.total_elements ?? data.totalElements ?? data.amount ?? null

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
  },

  async getReplyById(id: number): Promise<ReplyResponse> {
    const res = await oplearnClient.get<ResponseGeneral<ReplyResponse>>(`/replies/${id}`)
    return res.data.data
  },

  async createReply(data: ReplyRequest): Promise<ReplyResponse> {
    const commentId = data.commentId ?? (data as any).comment_id
    const payload = {
      content: data.content,
      commentId,
      comment_id: commentId,
    }
    const res = await oplearnClient.post<any>('/replies', payload)
    const result = res.data?.data || res.data
    const uId = result?.userId ?? result?.user_id
    const uName = result?.username
    if (uId && uName) {
      localStorage.setItem(`user_id_${uName}`, String(uId))
      localStorage.setItem('last_known_user_id', String(uId))
    }
    return result
  },

  async updateReply(id: number, content: string): Promise<ReplyResponse> {
    const res = await oplearnClient.put<ResponseGeneral<ReplyResponse>>(`/replies/${id}`, { content })
    return res.data.data
  },

  async deleteReply(id: number): Promise<void> {
    await oplearnClient.delete(`/replies/${id}`)
  },
}
