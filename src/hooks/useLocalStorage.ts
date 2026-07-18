import { useState } from 'react'
import { storage } from '@/utils/storage'

/** State đồng bộ với localStorage — dùng cho theme, cài đặt người dùng… */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => storage.get<T>(key) ?? initialValue)

  const setStoredValue = (newValue: T) => {
    setValue(newValue)
    storage.set(key, newValue)
  }

  return [value, setStoredValue] as const
}
