import { oplearnClient } from './oplearnClient'
import type { ResponseGeneral, PoemStatisticsResponse } from '@/types'

export const statisticService = {
  /** Lấy toàn bộ số lượt xem, thích, chia sẻ, bình luận của bài thơ có ID tương ứng */
  async getPoemStatistics(poemId: number): Promise<PoemStatisticsResponse> {
    const res = await oplearnClient.get<ResponseGeneral<PoemStatisticsResponse>>(`/statistics/${poemId}`)
    return res.data.data
  },
}
