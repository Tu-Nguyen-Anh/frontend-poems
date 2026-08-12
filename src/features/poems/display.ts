import type { PoemResponse } from '@/types'

const PLACEHOLDER_TITLE = '(không tiêu đề)'

type PoemLike = Partial<Pick<PoemResponse, 'name' | 'content' | 'authorName'>>

/**
 * Tựa hiển thị của bài thơ. Nếu bài không có tựa thật (rỗng hoặc placeholder
 * "(không tiêu đề)"), lấy câu thơ đầu tiên làm tựa. Chỉ ảnh hưởng UI, không đổi DB.
 */
export function poemDisplayTitle(poem: PoemLike): string {
  const name = poem.name?.trim()
  if (name && name !== PLACEHOLDER_TITLE) return name

  const firstLine = poem.content
    ?.split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0)

  if (firstLine) return firstLine.length > 70 ? `${firstLine.slice(0, 70)}…` : firstLine
  return 'Không đề'
}

/** Tên tác giả hiển thị; khuyết danh → "Khuyết danh". API trả snake_case nên đọc cả hai. */
export function poemAuthorName(poem: PoemLike & { author_name?: string }): string {
  return (poem.authorName ?? poem.author_name)?.trim() || 'Khuyết danh'
}

/** Tên thể loại hiển thị; API trả snake_case nên đọc cả hai. */
export function poemGenreName(poem: { genreName?: string; genre_name?: string }): string {
  return (poem.genreName ?? poem.genre_name)?.trim() || 'Thơ'
}
