import { useReaderMode } from '@/contexts/ReaderModeContext'
import { IconSun, IconMoon } from '@/components/ui/icons'

export function ReaderModeToggle() {
  const { mode, setMode } = useReaderMode()
  const isDark = mode === 'modern-dark'

  return (
    <button
      onClick={() => setMode(isDark ? 'modern-light' : 'modern-dark')}
      title={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
      aria-label={isDark ? 'Chế độ sáng' : 'Chế độ tối'}
      className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-medium border border-slate-200/60 dark:border-slate-700/60"
    >
      {isDark ? (
        <>
          <IconSun size={16} />
          <span className="hidden sm:inline">Sáng</span>
        </>
      ) : (
        <>
          <IconMoon size={16} />
          <span className="hidden sm:inline">Tối</span>
        </>
      )}
    </button>
  )
}
