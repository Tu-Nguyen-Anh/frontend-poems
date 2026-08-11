import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { ReaderStyleMode } from '@/types'

interface ReaderModeContextType {
  mode: ReaderStyleMode
  setMode: (mode: ReaderStyleMode) => void
  toggleMode: () => void
}

const STORAGE_KEY = 'poems_reader_style_mode'

const ReaderModeContext = createContext<ReaderModeContextType | null>(null)

export function ReaderModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ReaderStyleMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ReaderStyleMode
    return saved || 'classic-sepia'
  })

  const setMode = (newMode: ReaderStyleMode) => {
    setModeState(newMode)
    localStorage.setItem(STORAGE_KEY, newMode)
  }

  const toggleMode = () => {
    if (mode === 'classic-sepia') {
      setMode('modern-light')
    } else if (mode === 'modern-light') {
      setMode('modern-dark')
    } else {
      setMode('classic-sepia')
    }
  }

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-reader-mode', mode)
    // Tailwind dark: variants dùng chiến lược 'class' → bật/tắt .dark theo mode.
    root.classList.toggle('dark', mode === 'modern-dark')
  }, [mode])

  return (
    <ReaderModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </ReaderModeContext.Provider>
  )
}

export function useReaderMode(): ReaderModeContextType {
  const ctx = useContext(ReaderModeContext)
  if (!ctx) throw new Error('useReaderMode must be used within ReaderModeProvider')
  return ctx
}
