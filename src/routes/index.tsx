import { lazy } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { MainLayout } from '@/components/layout/MainLayout'
import { PATHS } from './paths'

// Lazy load từng trang — trang nào vào mới tải trang đó
const HomePage = lazy(() => import('@/features/home/pages/HomePage'))
const UsersPage = lazy(() => import('@/features/users/pages/UsersPage'))
const PoemsPage = lazy(() => import('@/features/poems/pages/PoemsPage'))
const PoemDetailPage = lazy(() => import('@/features/poems/pages/PoemDetailPage'))
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const ProfilePage = lazy(() => import('@/features/auth/pages/ProfilePage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: PATHS.HOME, element: <HomePage /> },
      { path: PATHS.USERS, element: <UsersPage /> },
      {
        // Backend yêu cầu đăng nhập cho /api/v1/poems → chặn từ route
        path: PATHS.POEMS,
        element: (
          <ProtectedRoute>
            <PoemsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: PATHS.POEM_DETAIL,
        element: (
          <ProtectedRoute>
            <PoemDetailPage />
          </ProtectedRoute>
        ),
      },
      { path: PATHS.LOGIN, element: <LoginPage /> },
      {
        path: PATHS.PROFILE,
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export function AppRoutes() {
  return <RouterProvider router={router} />
}
