import type { UserPreferences } from '@/types'

const PREF_KEY_PREFIX = 'user_poem_preferences_'

export const DEFAULT_PREFERENCES: UserPreferences = {
  authorIds: [],
  genreIds: [],
  eras: [],
}

export function getUserPreferences(userId?: number | string | null): UserPreferences {
  if (!userId) return { ...DEFAULT_PREFERENCES }
  try {
    const raw = localStorage.getItem(`${PREF_KEY_PREFIX}${userId}`)
    if (!raw) return { ...DEFAULT_PREFERENCES }
    const parsed = JSON.parse(raw)
    return {
      authorIds: Array.isArray(parsed.authorIds) ? parsed.authorIds.slice(0, 3) : [],
      genreIds: Array.isArray(parsed.genreIds) ? parsed.genreIds.slice(0, 3) : [],
      eras: Array.isArray(parsed.eras) ? parsed.eras.slice(0, 3) : [],
    }
  } catch {
    return { ...DEFAULT_PREFERENCES }
  }
}

export function saveUserPreferences(userId: number | string, preferences: UserPreferences): void {
  if (!userId) return
  const safe: UserPreferences = {
    authorIds: (preferences.authorIds || []).slice(0, 3),
    genreIds: (preferences.genreIds || []).slice(0, 3),
    eras: (preferences.eras || []).slice(0, 3),
  }
  localStorage.setItem(`${PREF_KEY_PREFIX}${userId}`, JSON.stringify(safe))
  window.dispatchEvent(new CustomEvent('preferences-changed', { detail: { userId, preferences: safe } }))
}

export function hasUserPreferences(userId?: number | string | null): boolean {
  const prefs = getUserPreferences(userId)
  return prefs.authorIds.length > 0 || prefs.genreIds.length > 0 || prefs.eras.length > 0
}
