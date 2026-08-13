import { createContext, useContext } from 'react'

/** Một mốc đã chọn (thể thơ / tác giả) — cần cả id để lọc và label để hiển thị. */
export interface Ref {
  id: number
  label: string
}

/** Đường dẫn đang duyệt trong cây phân cấp. */
export interface BrowseSelection {
  language?: string
  era?: string
  genre?: Ref
  author?: Ref
  poemId?: number
}

/** Bài thơ tối thiểu để dựng slug điều hướng. */
export interface PoemRef {
  id: number
  name?: string
  author?: string
}

export interface BrowseContextValue {
  selection: BrowseSelection
  selectLanguage: (language: string) => void
  selectEra: (era: string) => void
  selectGenre: (genre: Ref) => void
  selectAuthor: (author: Ref) => void
  selectPoem: (poem: PoemRef) => void
  /** Đặt trọn đường dẫn (cây trái dùng: bấm nhánh sâu set đủ các cấp trên). */
  selectPath: (selection: BrowseSelection) => void
}

export const BrowseContext = createContext<BrowseContextValue | null>(null)

export function useBrowse(): BrowseContextValue {
  const ctx = useContext(BrowseContext)
  if (!ctx) throw new Error('useBrowse phải nằm trong <BrowseContext.Provider>')
  return ctx
}
