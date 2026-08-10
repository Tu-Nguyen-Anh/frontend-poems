import { oplearnClient } from './oplearnClient'
import type { ResponseGeneral, ReplyResponse, ReplyRequest } from '@/types'

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
    return res.data?.data || res.data
  },

  async updateReply(id: number, content: string): Promise<ReplyResponse> {
    const res = await oplearnClient.put<ResponseGeneral<ReplyResponse>>(`/replies/${id}`, { content })
    return res.data.data
  },

  async deleteReply(id: number): Promise<void> {
    await oplearnClient.delete(`/replies/${id}`)
  },
}
