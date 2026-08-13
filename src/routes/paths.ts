export const PATHS = {
  HOME: '/',
  POEMS: '/poems',
  POEM_DETAIL: '/poems/:id',
  POEM_SLUG: '/:slug',
  AUTHORS: '/authors',
  AUTHOR_DETAIL: '/authors/:id',
  GENRES: '/genres',
  GENRE_DETAIL: '/genres/:id',
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile',
  // Admin Dashboard routes
  ADMIN: '/admin',
  ADMIN_POEMS: '/admin/poems',
  ADMIN_AUTHORS: '/admin/authors',
  ADMIN_GENRES: '/admin/genres',
  ADMIN_FEEDBACKS: '/admin/feedbacks',
  ADMIN_USERS: '/admin/users',
} as const

/** Bỏ dấu tiếng Việt + chuẩn hoá thành slug (a-z, 0-9, gạch nối). */
export function slugify(input: string): string {
  return (input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // bỏ dấu thanh/mũ/móc
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '')
}

interface PoemLike {
  id: number
  name?: string
  authorName?: string
  author_name?: string
}

/** Slug bài thơ: `tên-bài-tác-giả-<mã>`; mã = id ở base36 để phân giải ngược. */
export function poemSlug(p: PoemLike): string {
  const title = slugify(p.name || '')
  const author = slugify(p.authorName || p.author_name || '')
  const token = p.id.toString(36)
  return [title, author, token].filter(Boolean).join('-')
}

/** Đường dẫn slug ở gốc: `/qua-deo-ngang-ba-huyen-thanh-quan-<mã>`. */
export const toPoemSlug = (p: PoemLike) => `/${poemSlug(p)}`

/** Lấy lại id bài thơ từ slug (đọc segment cuối là mã base36). */
export function poemIdFromSlug(slug: string): number | null {
  const token = (slug || '').split('-').pop() || ''
  const id = parseInt(token, 36)
  return Number.isFinite(id) && id > 0 ? id : null
}

/** Link theo id (dùng nơi chỉ có id, hoặc fallback tương thích cũ /poems/:id). */
export const toPoemDetail = (id: number | string) => `/poems/${id}`
export const toAuthorDetail = (id: number | string) => `/authors/${id}`
export const toGenreDetail = (id: number | string) => `/genres/${id}`
