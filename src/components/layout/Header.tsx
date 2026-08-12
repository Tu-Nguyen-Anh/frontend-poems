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
  const navigate = useNavigate()

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
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-white/85 dark:bg-slate-900/85 backdrop-blur border-b border-slate-200/70 dark:border-slate-800/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link to={PATHS.HOME} className="flex-shrink-0 font-serif text-xl font-bold tracking-tight text-amber-800 dark:text-amber-200">
          Tiểu Thi Hào
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

        <div className="flex items-center gap-3">
          <ReaderModeToggle />

          {isAuthenticated ? (
            <UserDropdown />
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to={PATHS.LOGIN}
                className="px-3.5 py-1.5 text-sm font-medium text-amber-800 dark:text-amber-200 hover:bg-amber-100/60 dark:hover:bg-amber-950/50 rounded-md transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                to={PATHS.REGISTER}
                className="px-3.5 py-1.5 text-sm font-medium text-white bg-amber-700 hover:bg-amber-800 rounded-md transition-colors"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
