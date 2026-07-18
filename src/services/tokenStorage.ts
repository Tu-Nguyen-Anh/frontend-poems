import { STORAGE_KEYS } from '@/constants'
import { storage } from '@/utils/storage'
import type { TokenResponse } from './api.types'

/** Nơi duy nhất đọc/ghi token — không thao tác storage token ở chỗ khác. */
export const tokenStorage = {
  getAccessToken: () => storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN),
  getRefreshToken: () => storage.get<string>(STORAGE_KEYS.REFRESH_TOKEN),

  save(tokens: TokenResponse): void {
    storage.set(STORAGE_KEYS.ACCESS_TOKEN, tokens.access_token)
    storage.set(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh_token)
  },

  clear(): void {
    storage.remove(STORAGE_KEYS.ACCESS_TOKEN)
    storage.remove(STORAGE_KEYS.REFRESH_TOKEN)
    storage.remove(STORAGE_KEYS.USER)
  },
}
