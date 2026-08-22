import { Suspense } from 'react'
import { Outlet, NavLink, Link } from 'react-router-dom'
import { PATHS } from '@/routes/paths'
import { useAuth } from '@/hooks/useAuth'
import { Skeleton } from '@/components/ui/Skeleton'
import { ReaderModeToggle } from '@/components/layout/ReaderModeToggle'

const ADMIN_NAV = [
  { to: PATHS.ADMIN, label: 'Tổng quan', exact: true },
  { to: PATHS.ADMIN_POEMS, label: 'Bài thơ' },
  { to: PATHS.ADMIN_AUTHORS, label: 'Tác giả' },
  { to: PATHS.ADMIN_GENRES, label: 'Thể loại' },
  { to: PATHS.ADMIN_FEEDBACKS, label: 'Góp ý' },
  { to: PATHS.ADMIN_USERS, label: 'Người dùng' },
]

export function AdminLayout() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-[var(--c-bg)] text-[var(--c-text)] flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[var(--c-surface)] border-b md:border-b-0 md:border-r border-[var(--c-border)] p-4 flex flex-col justify-between flex-shrink-0">
        <div>
          <div className="flex items-center justify-between gap-2 pb-6 border-b border-[var(--c-border)] mb-6">
            <Link to={PATHS.HOME} className="flex items-center gap-2">
              <span className="font-serif font-bold text-[var(--c-gold)] text-lg">Trang quản trị</span>
            </Link>
          </div>

          <nav className="space-y-1">
            {ADMIN_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[var(--c-gold)] text-white'
                      : 'text-[var(--c-muted)] hover:bg-[var(--c-surface-2)] hover:text-[var(--c-text)]'
                  }`
                }
              >
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="pt-6 border-t border-[var(--c-border)] mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--c-muted)]">Giao diện</span>
            <ReaderModeToggle />
          </div>
          <div className="flex items-center justify-between text-xs text-[var(--c-muted)]">
            <div>
              <p className="font-semibold text-[var(--c-heading)]">{user?.username}</p>
              <p className="text-[10px] text-[var(--c-gold)] font-mono">ADMIN</p>
            </div>
            <Link to={PATHS.HOME} className="text-[var(--c-gold)] hover:underline">
              Về trang chủ
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <Suspense fallback={<Skeleton className="h-64 rounded-xl bg-[var(--c-surface-2)]" />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
