import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Spinner } from '@/components/ui'
import { Footer } from './Footer'
import { Header } from './Header'

/** Layout chung: header + vùng nội dung + footer. */
export function MainLayout() {
  return (
    <div className="layout">
      <Header />
      <main className="layout__content">
        <Suspense fallback={<Spinner />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
