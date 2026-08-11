import { Suspense } from 'react'
import { Outlet, NavLink, Link } from 'react-router-dom'
import { PATHS } from '@/routes/paths'
import { useAuth } from '@/hooks/useAuth'
import { Skeleton } from '@/components/ui/Skeleton'

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 p-4 flex flex-col justify-between flex-shrink-0">
        <div>
          <div className="flex items-center justify-between gap-2 pb-6 border-b border-slate-800 mb-6">
            <Link to={PATHS.HOME} className="flex items-center gap-2">
              <span className="font-serif font-bold text-amber-400 text-lg">Trang quản trị</span>
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
                      ? 'bg-amber-700 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`
                }
              >
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800 mt-6 flex items-center justify-between text-xs text-slate-400">
          <div>
            <p className="font-semibold text-slate-200">{user?.username}</p>
            <p className="text-[10px] text-amber-400 font-mono">ADMIN</p>
          </div>
          <Link to={PATHS.HOME} className="text-amber-400 hover:underline">
            Về trang chủ
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <Suspense fallback={<Skeleton className="h-64 rounded-xl bg-slate-900" />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
