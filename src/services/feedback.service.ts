import { oplearnClient } from './oplearnClient'
import { FeedbackStatus } from '@/types'
import type { ResponseGeneral, PageResponse, FeedbackResponse, FeedbackRequest } from '@/types'

export const feedbackService = {
  async getFeedbacks(params?: {
    status?: FeedbackStatus
    page?: number
    size?: number
    isAll?: boolean
  }): Promise<PageResponse<FeedbackResponse>> {
    const res = await oplearnClient.get<ResponseGeneral<PageResponse<FeedbackResponse>>>('/feedbacks', {
      params: {
        status: params?.status,
        page: params?.page ?? 0,
        size: params?.size ?? 10,
        isAll: params?.isAll ?? false,
      },
    })
    return res.data.data
  },

  async getFeedbacksByPoem(poemId: number, params?: { page?: number; size?: number }): Promise<PageResponse<FeedbackResponse>> {
    const res = await oplearnClient.get<ResponseGeneral<PageResponse<FeedbackResponse>>>(`/feedbacks/poem/${poemId}`, {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 10,
      },
    })
    return res.data.data
  },

  async getFeedbacksByUser(userId: number, params?: { page?: number; size?: number }): Promise<PageResponse<FeedbackResponse>> {
    const res = await oplearnClient.get<ResponseGeneral<PageResponse<FeedbackResponse>>>(`/feedbacks/user/${userId}`, {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 10,
      },
    })
    return res.data.data
  },

  async getFeedbackById(id: number): Promise<FeedbackResponse> {
    const res = await oplearnClient.get<ResponseGeneral<FeedbackResponse>>(`/feedbacks/${id}`)
    return res.data.data
  },

  async createFeedback(data: FeedbackRequest): Promise<FeedbackResponse> {
    const poemId = data.poemId ?? (data as any).poem_id
    const payload: any = {
      content: data.content,
      poemId,
      poem_id: poemId,
    }
    if (poemId) payload.poem = { id: poemId }

    try {
      const res = await oplearnClient.post<any>('/feedbacks', payload, { params: { poemId, poem_id: poemId } })
      return res.data?.data || res.data
    } catch (err1: any) {
      try {
        const res = await oplearnClient.post<any>(`/feedbacks/poem/${poemId}`, payload, { params: { poemId, poem_id: poemId } })
        return res.data?.data || res.data
      } catch {
        const res = await oplearnClient.post<any>(`/poems/${poemId}/feedbacks`, payload, { params: { poemId, poem_id: poemId } })
        return res.data?.data || res.data
      }
    }
  },

  async updateFeedback(id: number, data: FeedbackRequest): Promise<FeedbackResponse> {
    const res = await oplearnClient.put<ResponseGeneral<FeedbackResponse>>(`/feedbacks/${id}`, data)
    return res.data.data
  },

  async updateFeedbackStatus(id: number, status: FeedbackStatus | string): Promise<void> {
    const isApprove = status === FeedbackStatus.RESOLVED || status === FeedbackStatus.APPROVED || status === 'RESOLVED' || status === 'APPROVED'
    const statusStr = isApprove ? 'RESOLVED' : 'REJECTED'
    const payload = { status: statusStr }

    try {
      await oplearnClient.put(`/feedbacks/status/${id}`, payload, { params: { status: statusStr } })
      return
    } catch (e1: any) {
      try {
        await oplearnClient.put(`/feedbacks/${id}/status`, payload, { params: { status: statusStr } })
        return
      } catch (e2: any) {
        try {
          await oplearnClient.put(`/feedbacks/${id}`, payload, { params: { status: statusStr } })
          return
        } catch (e3: any) {
          const actionPath = isApprove ? 'resolve' : 'reject'
          try {
            await oplearnClient.put(`/feedbacks/${id}/${actionPath}`, payload)
            return
          } catch (e4: any) {
            try {
              await oplearnClient.post(`/feedbacks/${id}/${actionPath}`, payload)
              return
            } catch (e5: any) {
              const fallbackPath = isApprove ? 'approve' : 'reject'
              try {
                await oplearnClient.put(`/feedbacks/${id}/${fallbackPath}`, payload)
                return
              } catch {
                throw e1
              }
            }
          }
        }
      }
    }
  },

  async deleteFeedback(id: number): Promise<void> {
    await oplearnClient.delete(`/feedbacks/${id}`)
  },
}
