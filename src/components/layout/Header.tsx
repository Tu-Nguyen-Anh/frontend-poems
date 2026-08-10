import { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { PATHS } from '@/routes/paths'
import { UserDropdown } from './UserDropdown'
import { ReaderModeToggle } from './ReaderModeToggle'

export function Header() {
  const { isAuthenticated } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`${PATHS.POEMS}?keyword=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/60 dark:border-slate-800/60 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to={PATHS.HOME} className="flex items-center gap-2 group flex-shrink-0">
          <span className="text-2xl transition transform group-hover:scale-110">📜</span>
          <span className="text-xl font-serif font-bold tracking-tight bg-gradient-to-r from-amber-700 via-amber-600 to-amber-900 dark:from-amber-200 dark:via-amber-400 dark:to-amber-100 bg-clip-text text-transparent">
            Thi Đàn Poems
          </span>
        </Link>

        {/* Quick Search */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xs relative">
          <input
            type="text"
            placeholder="Tìm bài thơ, tác giả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-slate-800 dark:text-slate-100 placeholder-slate-400 transition"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
        </form>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          <NavLink
            to={PATHS.HOME}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-amber-100/70 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200'
                  : 'text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400'
              }`
            }
          >
            Trang Chủ
          </NavLink>
          <NavLink
            to={PATHS.POEMS}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-amber-100/70 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200'
                  : 'text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400'
              }`
            }
          >
            Kho Thơ
          </NavLink>
          <NavLink
            to={PATHS.AUTHORS}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-amber-100/70 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200'
                  : 'text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400'
              }`
            }
          >
            Tác Giả
          </NavLink>
          <NavLink
            to={PATHS.GENRES}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-amber-100/70 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200'
                  : 'text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400'
              }`
            }
          >
            Thể Loại
          </NavLink>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <ReaderModeToggle />

          {isAuthenticated ? (
            <UserDropdown />
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to={PATHS.LOGIN}
                className="px-3.5 py-1.5 text-sm font-medium text-amber-800 dark:text-amber-200 hover:bg-amber-100/60 dark:hover:bg-amber-950/60 rounded-xl transition"
              >
                Đăng Nhập
              </Link>
              <Link
                to={PATHS.REGISTER}
                className="px-3.5 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 rounded-xl shadow-md shadow-amber-600/20 transition transform active:scale-95"
              >
                Đăng Ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
