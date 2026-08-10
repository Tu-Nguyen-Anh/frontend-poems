export const PATHS = {
  HOME: '/',
  POEMS: '/poems',
  POEM_DETAIL: '/poems/:id',
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

export const toPoemDetail = (id: number | string) => `/poems/${id}`
export const toAuthorDetail = (id: number | string) => `/authors/${id}`
export const toGenreDetail = (id: number | string) => `/genres/${id}`
