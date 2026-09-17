import { Suspense, useEffect } from 'react'
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { PATHS } from '@/routes/paths'
import { useAuth } from '@/hooks/useAuth'
import { useWebSocket } from '@/contexts/WebSocketContext'
import { Skeleton } from '@/components/ui/Skeleton'
import { ReaderModeToggle } from '@/components/layout/ReaderModeToggle'
import { NotificationDropdown } from '@/components/layout/NotificationDropdown'
import { GlobalChatWidget } from '@/components/chat/GlobalChatWidget'

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
  const { onlineCount, isConnected } = useWebSocket()
  const navigate = useNavigate()

  // Lắng nghe sự kiện điều hướng SPA toàn cục
  useEffect(() => {
    const handleGlobalNav = (e: Event) => {
      const customEvent = e as CustomEvent<string>
      if (customEvent.detail) {
        window.dispatchEvent(new CustomEvent('poems-navigate-ack'))
        navigate(customEvent.detail)
      }
    }
    window.addEventListener('poems-navigate', handleGlobalNav)
    return () => window.removeEventListener('poems-navigate', handleGlobalNav)
  }, [navigate])

  return (
    <div className="min-h-screen bg-[var(--c-bg)] text-[var(--c-text)] flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[var(--c-surface)] border-b md:border-b-0 md:border-r border-[var(--c-border)] p-4 flex flex-col justify-between flex-shrink-0">
        <div>
          <div className="flex items-center justify-between gap-2 pb-6 border-b border-[var(--c-border)] mb-6">
            <Link to={PATHS.HOME} className="flex items-center gap-2">
              <span className="font-serif font-bold text-[var(--c-gold)] text-lg">Trang quản trị</span>
            </Link>
            <NotificationDropdown />
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
          <div className="flex items-center justify-between text-xs text-[var(--c-muted)]">
            <span>Máy chủ realtime</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
              <span className="relative flex h-2 w-2">
                {isConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              </span>
              <span className="tabular-nums font-semibold">{onlineCount}</span> online
            </span>
          </div>
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
      <GlobalChatWidget />
    </div>
  )
}
