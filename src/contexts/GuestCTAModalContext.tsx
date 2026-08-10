import { createContext, useContext, useState, type ReactNode } from 'react'

interface GuestCTAModalContextType {
  isOpen: boolean
  actionName: string
  openModal: (actionName?: string) => void
  closeModal: () => void
}

const GuestCTAModalContext = createContext<GuestCTAModalContextType | null>(null)

export function GuestCTAModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [actionName, setActionName] = useState('thực hiện thao tác này')

  const openModal = (action?: string) => {
    if (action) setActionName(action)
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
  }

  return (
    <GuestCTAModalContext.Provider value={{ isOpen, actionName, openModal, closeModal }}>
      {children}
    </GuestCTAModalContext.Provider>
  )
}

export function useGuestCTAModal(): GuestCTAModalContextType {
  const ctx = useContext(GuestCTAModalContext)
  if (!ctx) throw new Error('useGuestCTAModal must be used within GuestCTAModalProvider')
  return ctx
}
