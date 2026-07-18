import type { ReactNode } from 'react'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { AuthProvider } from '@/contexts/AuthProvider'

/**
 * Gom toàn bộ provider toàn cục vào 1 chỗ.
 * Cần thêm provider mới (theme, query client…) → chỉ sửa file này.
 */
export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>{children}</AuthProvider>
    </ErrorBoundary>
  )
}
