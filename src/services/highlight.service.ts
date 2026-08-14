import { oplearnClient } from './oplearnClient'
import type { ResponseGeneral, PageResponse } from '@/types'

export interface Highlight {
  id: number
  poemId: number
  startOffset: number
  endOffset: number
  selectedText: string
  note: string | null
  createdAt?: string
}

export interface HighlightWithPoem extends Highlight {
  poemName: string
  authorName?: string
}

/** API trả snake_case (Jackson global) → map về camelCase cho gọn phía UI. */
function mapHighlight(d: any): Highlight {
  return {
    id: d.id,
    poemId: d.poem_id ?? d.poemId,
    startOffset: d.start_offset ?? d.startOffset,
    endOffset: d.end_offset ?? d.endOffset,
    selectedText: d.selected_text ?? d.selectedText ?? '',
    note: d.note ?? null,
    createdAt: d.created_at ?? d.createdAt,
  }
}

function mapWithPoem(d: any): HighlightWithPoem {
  return {
    ...mapHighlight(d),
    poemName: d.poem_name ?? d.poemName ?? '',
    authorName: d.author_name ?? d.authorName,
  }
}

export const highlightService = {
  /** Highlight của bài (user hiện tại) để render trên trang chi tiết. */
  async listByPoem(poemId: number): Promise<Highlight[]> {
    const res = await oplearnClient.get<ResponseGeneral<any[]>>(`/highlights/poem/${poemId}`)
    return (res.data.data || []).map(mapHighlight)
  },

  async create(input: {
    poemId: number
    startOffset: number
    endOffset: number
    selectedText: string
    note?: string
  }): Promise<Highlight> {
    const res = await oplearnClient.post<ResponseGeneral<any>>('/highlights', {
      poem_id: input.poemId,
      start_offset: input.startOffset,
      end_offset: input.endOffset,
      selected_text: input.selectedText,
      note: input.note ?? null,
    })
    return mapHighlight(res.data.data)
  },

  async updateNote(id: number, note: string): Promise<Highlight> {
    const res = await oplearnClient.put<ResponseGeneral<any>>(`/highlights/${id}`, { note })
    return mapHighlight(res.data.data)
  },

  async remove(id: number): Promise<void> {
    await oplearnClient.delete(`/highlights/${id}`)
  },

  /** Toàn bộ highlight của user, kèm tên bài — trang "Ghi chú của tôi". */
  async myHighlights(params?: { page?: number; size?: number }): Promise<PageResponse<HighlightWithPoem>> {
    const res = await oplearnClient.get<ResponseGeneral<PageResponse<any>>>('/highlights', {
      params: { page: params?.page ?? 0, size: params?.size ?? 50 },
    })
    const data = res.data.data
    return { content: (data.content || []).map(mapWithPoem), amount: data.amount }
  },
}
