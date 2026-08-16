import { useState, useEffect } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { PATHS } from '@/routes/paths'
import { useDebounce } from '@/hooks/useDebounce'
import { IconSearch } from '@/components/ui/icons'
import { UserDropdown } from './UserDropdown'
import { ReaderModeToggle } from './ReaderModeToggle'

const NAV_LINKS = [
  { to: PATHS.HOME, label: 'Trang chủ', end: true },
  { to: PATHS.POEMS, label: 'Kho thơ', end: false },
  { to: PATHS.STORIES, label: 'Truyện ngắn', end: false },
  { to: PATHS.AUTHORS, label: 'Tác giả', end: false },
  { to: PATHS.GENRES, label: 'Thể loại', end: false },
]

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
    isActive
      ? 'text-amber-900 bg-amber-100/70 dark:text-amber-200 dark:bg-amber-950/50'
      : 'text-slate-600 hover:text-amber-700 dark:text-slate-300 dark:hover:text-amber-300'
  }`

export function Header() {
  const { isAuthenticated } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedQuery = useDebounce(searchQuery, 300)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [focusMode, setFocusMode] = useState(() => localStorage.getItem('poems_focus_mode') === '1')
  const navigate = useNavigate()

  const toggleFocus = () => {
    setFocusMode((f) => {
      const next = !f
      localStorage.setItem('poems_focus_mode', next ? '1' : '0')
      return next
    })
  }

  // Tìm kiếm realtime: gõ tới đâu điều hướng tới danh sách thơ tới đó.
  useEffect(() => {
    const q = debouncedQuery.trim()
    if (!q) return
    navigate(`${PATHS.POEMS}?keyword=${encodeURIComponent(q)}`, { replace: true })
  }, [debouncedQuery, navigate])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`${PATHS.POEMS}?keyword=${encodeURIComponent(searchQuery.trim())}`)
      setMobileOpen(false)
    }
  }

  return (
    <>
    <header className="sticky top-0 z-40 w-full bg-white/85 dark:bg-slate-900/85 backdrop-blur border-b border-slate-200/70 dark:border-slate-800/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-3">
        <Link to={PATHS.HOME} className="flex-shrink-0 flex items-center gap-2 min-w-0">
          <img src="/logo.png" alt="Tiểu Thi Hào" className="h-8 w-8 sm:h-10 sm:w-10 object-contain flex-shrink-0" />
          <span className="font-serif text-base sm:text-lg lg:text-xl font-bold tracking-tight text-amber-800 dark:text-amber-200 truncate">
            Tiểu Thi Hào
          </span>
        </Link>

        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xs relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <IconSearch size={16} />
          </span>
          <input
            type="text"
            placeholder="Tìm tên bài, tác giả, hoặc một câu thơ…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-800 dark:text-slate-100 placeholder-slate-400"
          />
        </form>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={navLinkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={toggleFocus}
            aria-label="Chế độ tập trung khi đọc"
            aria-pressed={focusMode}
            title="Chế độ tập trung (làm tối xung quanh)"
            className={`inline-flex p-2 rounded-md transition-colors ${
              focusMode
                ? 'text-amber-700 bg-amber-100/70 dark:text-amber-300 dark:bg-amber-950/50'
                : 'text-slate-500 hover:text-amber-700 hover:bg-amber-100/60 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
          </button>

          <ReaderModeToggle />

          {isAuthenticated ? (
            <UserDropdown />
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                to={PATHS.LOGIN}
                className="px-2.5 py-1 text-xs sm:px-3.5 sm:py-1.5 sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap text-amber-800 dark:text-amber-200 bg-amber-100/70 hover:bg-amber-200/70 dark:bg-amber-950/50 dark:hover:bg-amber-900/60"
              >
                Đăng nhập
              </Link>
              <Link
                to={PATHS.REGISTER}
                className="hidden sm:inline-block px-2.5 py-1 text-xs sm:px-3.5 sm:py-1.5 sm:text-sm font-medium text-white bg-amber-700 hover:bg-amber-800 rounded-md transition-colors whitespace-nowrap"
              >
                Đăng ký
              </Link>
            </div>
          )}

          {/* Nút menu mobile (ẩn từ lg trở lên) */}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Menu"
            aria-expanded={mobileOpen}
            className="lg:hidden p-2 -mr-1 rounded-md text-slate-600 hover:text-amber-700 hover:bg-amber-100/60 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {mobileOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Panel menu mobile */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-900">
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-3">
            <form onSubmit={handleSearch} className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <IconSearch size={16} />
              </span>
              <input
                type="text"
                placeholder="Tìm tên bài, tác giả, một câu thơ…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-800 dark:text-slate-100 placeholder-slate-400"
              />
            </form>

            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-amber-900 bg-amber-100/70 dark:text-amber-200 dark:bg-amber-950/50'
                        : 'text-slate-700 hover:bg-amber-50 dark:text-slate-300 dark:hover:bg-slate-800/60'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>

      {/* Overlay chế độ tập trung — giữa nét, xung quanh mờ dần (desktop);
          mobile không blur được nên làm tối nhẹ xung quanh (xem CSS). */}
      {focusMode && <div className="reading-focus-overlay" aria-hidden="true" />}
    </>
  )
}
