import { useReaderMode } from '@/contexts/ReaderModeContext'

export function ReaderModeToggle() {
  const { mode, toggleMode } = useReaderMode()

  return (
    <button
      onClick={toggleMode}
      title={`Chế độ đọc hiện tại: ${mode}`}
      className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 text-xs font-medium border border-slate-200/60 dark:border-slate-700/60"
    >
      {mode === 'classic-sepia' ? (
        <>
          📜 <span className="hidden sm:inline">Style Cổ Điển</span>
        </>
      ) : mode === 'modern-light' ? (
        <>
          ☀️ <span className="hidden sm:inline">Modern Light</span>
        </>
      ) : (
        <>
          🌙 <span className="hidden sm:inline">Modern Dark</span>
        </>
      )}
    </button>
  )
}
