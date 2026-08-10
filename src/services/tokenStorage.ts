import { STORAGE_KEYS } from '@/constants'
import { storage } from '@/utils/storage'
import type { TokenResponse, UserResponse } from '@/types'

/** Nơi duy nhất đọc/ghi token và user profile. */
export const tokenStorage = {
  getAccessToken: (): string | null => {
    const raw = storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN)
    if (!raw || typeof raw !== 'string') return null
    return raw.trim().replace(/^"+|"+$/g, '').replace(/^'+|'+$/g, '')
  },
  getRefreshToken: (): string | null => {
    const raw = storage.get<string>(STORAGE_KEYS.REFRESH_TOKEN)
    if (!raw || typeof raw !== 'string') return null
    return raw.trim().replace(/^"+|"+$/g, '').replace(/^'+|'+$/g, '')
  },
  getUser: (): UserResponse | null => storage.get<UserResponse>(STORAGE_KEYS.USER),

  saveTokens(tokens: any): void {
    if (!tokens) return
    let access = typeof tokens === 'string'
      ? tokens
      : tokens.accessToken || tokens.access_token || tokens.token || tokens.data?.accessToken || tokens.data?.token || tokens.data?.access_token
    let refresh = typeof tokens === 'object'
      ? tokens.refreshToken || tokens.refresh_token || tokens.data?.refreshToken || tokens.data?.refresh_token
      : null

    if (typeof access === 'string') {
      access = access.trim().replace(/^"+|"+$/g, '').replace(/^'+|'+$/g, '')
    }
    if (typeof refresh === 'string') {
      refresh = refresh.trim().replace(/^"+|"+$/g, '').replace(/^'+|'+$/g, '')
    }

    if (access) storage.set(STORAGE_KEYS.ACCESS_TOKEN, access)
    if (refresh) storage.set(STORAGE_KEYS.REFRESH_TOKEN, refresh)
  },

  saveUser(user: UserResponse): void {
    storage.set(STORAGE_KEYS.USER, user)
  },

  clear(): void {
    storage.remove(STORAGE_KEYS.ACCESS_TOKEN)
    storage.remove(STORAGE_KEYS.REFRESH_TOKEN)
    storage.remove(STORAGE_KEYS.USER)
  },
}
