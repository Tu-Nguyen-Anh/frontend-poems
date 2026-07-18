import { useSyncExternalStore } from 'react'
import { getTheme, subscribeTheme, toggleTheme, type Theme } from '@/utils/theme'

/** Theme hiện tại + hàm đổi, reactive cho component (vd nút toggle ở Header). */
export function useTheme(): { theme: Theme; toggle: () => void } {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, (): Theme => 'light')
  return { theme, toggle: toggleTheme }
}
