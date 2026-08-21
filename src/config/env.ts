/**
 * Đọc biến môi trường tập trung tại 1 nơi.
 * Code trong app chỉ import `env`, không dùng import.meta.env trực tiếp.
 */
export const env = {
  API_URL: import.meta.env.VITE_API_URL ?? 'https://jsonplaceholder.typicode.com',
  OPLEARN_API_URL: import.meta.env.VITE_OPLEARN_API_URL ?? 'http://localhost:8090/api/v1',
  /** Base URL ảnh chân dung tự crawl trên RustFS. Link = `${AVATAR_BASE_URL}/${avatar_local}`. */
  AVATAR_BASE_URL: import.meta.env.VITE_AVATAR_BASE_URL ?? 'https://rustfs.olhub.org/daithihao',
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '772102149835-vgiaigbr51untf545i1n8a4rsmv7r0tb.apps.googleusercontent.com',
  APP_NAME: import.meta.env.VITE_APP_NAME ?? 'React Base',
  IS_DEV: import.meta.env.DEV,
} as const
