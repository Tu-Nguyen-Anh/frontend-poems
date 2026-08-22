import type { ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 'lg' }: ModalProps) {
  if (!isOpen) return null

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }[maxWidth]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className={`bg-[var(--c-surface)] rounded-xl p-6 md:p-8 ${maxWidthClasses} w-full border border-[var(--c-border)] shadow-lg space-y-4 max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between border-b border-[var(--c-border)] pb-4">
          <h3 className="text-xl font-serif font-bold text-[var(--c-gold)]">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--c-muted)] hover:text-[var(--c-heading)] hover:bg-[var(--c-surface-2)] transition-colors"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  )
}
