import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Skeleton } from '@/components/ui/Skeleton'
import { Header } from './Header'
import { Footer } from './Footer'
import { useReaderMode } from '@/contexts/ReaderModeContext'
import { GuestCTAModal } from '@/components/common/GuestCTAModal'

export function MainLayout() {
  const { mode } = useReaderMode()

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 mode-${mode}`}>
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Suspense
          fallback={
            <div className="py-12 space-y-4 max-w-4xl mx-auto">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-48 w-full mt-6" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <GuestCTAModal />
    </div>
  )
}
