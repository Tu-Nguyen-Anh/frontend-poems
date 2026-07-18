import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks'
import { PATHS } from '@/routes/paths'

/** Bọc route cần đăng nhập — chưa đăng nhập thì chuyển về /login, nhớ trang đích. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to={PATHS.LOGIN} state={{ from: location.pathname }} replace />
  }
  return children
}
