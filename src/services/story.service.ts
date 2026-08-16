import { oplearnClient } from './oplearnClient'
import type {
  ResponseGeneral,
  PageResponse,
  StoryResponse,
  StoryChapterResponse,
  StoryCollection,
} from '@/types'

export const storyService = {
  /** Danh sách văn xuôi (phân trang, lọc theo thể loại + tìm kiếm tiêu đề/tác giả). */
  async getStories(params?: {
    keyword?: string
    collection?: string
    authorId?: number
    page?: number
    size?: number
  }): Promise<PageResponse<StoryResponse>> {
    const res = await oplearnClient.get<ResponseGeneral<PageResponse<StoryResponse>>>('/stories', {
      params: {
        keyword: params?.keyword || undefined,
        collection: params?.collection || undefined,
        authorId: params?.authorId || undefined,
        page: params?.page ?? 0,
        size: params?.size ?? 12,
      },
    })
    return res.data.data
  },

  /** Danh sách thể loại + số tác phẩm (cho dropdown lọc). */
  async getCollections(): Promise<StoryCollection[]> {
    const res = await oplearnClient.get<ResponseGeneral<StoryCollection[]>>('/stories/collections')
    return res.data.data || []
  },

  /** Chi tiết 1 tác phẩm: metadata + mục lục chương (không kèm nội dung). */
  async getStory(id: number): Promise<StoryResponse> {
    const res = await oplearnClient.get<ResponseGeneral<StoryResponse>>(`/stories/${id}`)
    return res.data.data
  },

  /** Nội dung 1 chương (tải theo yêu cầu khi người đọc mở chương). */
  async getChapter(id: number, seq: number): Promise<StoryChapterResponse> {
    const res = await oplearnClient.get<ResponseGeneral<StoryChapterResponse>>(
      `/stories/${id}/chapters/${seq}`,
    )
    return res.data.data
  },
}
