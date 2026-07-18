import { OplearnBaseService } from '@/services/oplearn-base.service'
import { POEM_PAGE_SIZE } from './constants'
import type { Poem } from './types'

export interface PoemListParams {
  keyword?: string
  genreId?: number | null
  page?: number
  size?: number
}

class PoemService extends OplearnBaseService<Poem> {
  constructor() {
    super('/poems')
  }

  /** Bọc list() của service cha để map tên param theo API (genre_id snake_case). */
  search({ keyword, genreId, page = 0, size = POEM_PAGE_SIZE }: PoemListParams = {}) {
    return this.list({
      keyword: keyword || undefined,
      genre_id: genreId ?? undefined,
      page,
      size,
    })
  }
}

export const poemService = new PoemService()
