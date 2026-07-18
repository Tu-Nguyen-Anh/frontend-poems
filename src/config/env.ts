/**
 * Đọc biến môi trường tập trung tại 1 nơi.
 * Code trong app chỉ import `env`, không dùng import.meta.env trực tiếp.
 */
export const env = {
  API_URL: import.meta.env.VITE_API_URL ?? 'https://jsonplaceholder.typicode.com',
  OPLEARN_API_URL: import.meta.env.VITE_OPLEARN_API_URL ?? 'http://localhost:8089/api/v1',
  APP_NAME: import.meta.env.VITE_APP_NAME ?? 'React Base',
  IS_DEV: import.meta.env.DEV,
} as const
