/** Khai báo đường dẫn tập trung — không hardcode chuỗi path trong component. */
export const PATHS = {
  HOME: '/',
  USERS: '/users',
  POEMS: '/poems',
  POEM_DETAIL: '/poems/:id',
  LOGIN: '/login',
  PROFILE: '/profile',
} as const

/** Build đường dẫn chi tiết bài viết từ id. */
export const toPoemDetail = (id: number | string) => `/poems/${id}`
