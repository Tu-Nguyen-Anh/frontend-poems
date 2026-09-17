import { oplearnClient } from './oplearnClient'
import type { ResponseGeneral, PageResponse, NotificationResponse } from '@/types'

export const notificationService = {
  /** Lấy số lượng thông báo chưa đọc của user hiện tại (hiển thị badge 🔔) */
  async getUnreadCount(): Promise<number> {
    const res = await oplearnClient.get<ResponseGeneral<number>>('/notifications/unread-count')
    return res.data?.data ?? 0
  },

  /** Lấy danh sách thông báo phân trang của user */
  async getFeed(params?: { page?: number; size?: number }): Promise<PageResponse<NotificationResponse>> {
    const res = await oplearnClient.get<ResponseGeneral<PageResponse<NotificationResponse>>>('/notifications', {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 20,
      },
    })
    return res.data?.data ?? { content: [], amount: 0 }
  },

  /** Đánh dấu 1 thông báo là đã đọc */
  async markAsRead(id: number): Promise<boolean> {
    const res = await oplearnClient.put<ResponseGeneral<boolean>>(`/notifications/${id}/read`)
    return !!res.data?.data
  },

  /** Đánh dấu tất cả thông báo của user là đã đọc */
  async markAllAsRead(): Promise<number> {
    const res = await oplearnClient.put<ResponseGeneral<number>>('/notifications/read-all')
    return res.data?.data ?? 0
  },
}
