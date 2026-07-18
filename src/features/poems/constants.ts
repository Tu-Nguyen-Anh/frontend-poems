import type { Genre } from './types'

/**
 * Backend chưa có API GET /genres nên tạm hardcode theo bảng `genres` trong DB.
 * Khi backend bổ sung endpoint, thay bằng genreService.getAll().
 */
export const GENRES: Genre[] = [
  { id: 1, name: 'bốn chữ' },
  { id: 2, name: 'năm chữ' },
  { id: 3, name: 'thơ tự do' },
  { id: 4, name: 'tám chữ' },
  { id: 5, name: 'sáu chữ' },
  { id: 6, name: 'lục bát' },
  { id: 7, name: 'bảy chữ' },
]

export const POEM_PAGE_SIZE = 6
