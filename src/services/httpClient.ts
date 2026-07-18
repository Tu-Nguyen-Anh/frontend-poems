import axios from 'axios'
import { env } from '@/config/env'

/**
 * Axios instance cho API demo public (jsonplaceholder) — không gắn token.
 * Backend oplearn (có access/refresh token) dùng oplearnClient.ts.
 */
export const httpClient = axios.create({
  baseURL: env.API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})
