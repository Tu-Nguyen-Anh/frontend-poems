import { lazy } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { AdminRoute } from '@/components/common/AdminRoute'
import { MainLayout } from '@/components/layout/MainLayout'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { PATHS } from './paths'

// Lazy load Client pages
const HomePage = lazy(() => import('@/features/home/pages/HomePage'))
const PoemsPage = lazy(() => import('@/features/poems/pages/PoemsPage'))
const PoemDetailPage = lazy(() => import('@/features/poems/pages/PoemDetailPage'))
const AuthorsPage = lazy(() => import('@/features/authors/pages/AuthorsPage'))
const AuthorDetailPage = lazy(() => import('@/features/authors/pages/AuthorDetailPage'))
const GenresPage = lazy(() => import('@/features/genres/pages/GenresPage'))
const GenreDetailPage = lazy(() => import('@/features/genres/pages/GenreDetailPage'))
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const ProfilePage = lazy(() => import('@/features/auth/pages/ProfilePage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

// Lazy load Admin pages
const AdminOverviewPage = lazy(() => import('@/features/admin/pages/AdminOverviewPage'))
const AdminPoemsPage = lazy(() => import('@/features/admin/pages/AdminPoemsPage'))
const AdminAuthorsPage = lazy(() => import('@/features/admin/pages/AdminAuthorsPage'))
const AdminGenresPage = lazy(() => import('@/features/admin/pages/AdminGenresPage'))
const AdminFeedbacksPage = lazy(() => import('@/features/admin/pages/AdminFeedbacksPage'))
const AdminUsersPage = lazy(() => import('@/features/admin/pages/AdminUsersPage'))

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: PATHS.HOME, element: <HomePage /> },
      { path: PATHS.POEMS, element: <PoemsPage /> },
      { path: PATHS.POEM_DETAIL, element: <PoemDetailPage /> },
      { path: PATHS.AUTHORS, element: <AuthorsPage /> },
      { path: PATHS.AUTHOR_DETAIL, element: <AuthorDetailPage /> },
      { path: PATHS.GENRES, element: <GenresPage /> },
      { path: PATHS.GENRE_DETAIL, element: <GenreDetailPage /> },
      { path: PATHS.LOGIN, element: <LoginPage /> },
      { path: PATHS.REGISTER, element: <LoginPage /> },
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
  {
    path: PATHS.ADMIN,
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      { index: true, element: <AdminOverviewPage /> },
      { path: PATHS.ADMIN_POEMS, element: <AdminPoemsPage /> },
      { path: PATHS.ADMIN_AUTHORS, element: <AdminAuthorsPage /> },
      { path: PATHS.ADMIN_GENRES, element: <AdminGenresPage /> },
      { path: PATHS.ADMIN_FEEDBACKS, element: <AdminFeedbacksPage /> },
      { path: PATHS.ADMIN_USERS, element: <AdminUsersPage /> },
    ],
  },
])

export function AppRoutes() {
  return <RouterProvider router={router} />
}
