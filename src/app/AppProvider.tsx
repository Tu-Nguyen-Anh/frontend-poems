import type { ReactNode } from 'react'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { AuthProvider } from '@/contexts/AuthProvider'
import { ReaderModeProvider } from '@/contexts/ReaderModeContext'
import { GuestCTAModalProvider } from '@/contexts/GuestCTAModalContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { WebSocketProvider } from '@/contexts/WebSocketContext'

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <WebSocketProvider>
            <ReaderModeProvider>
              <GuestCTAModalProvider>{children}</GuestCTAModalProvider>
            </ReaderModeProvider>
          </WebSocketProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}
