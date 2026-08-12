import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

type ToastType = 'error' | 'success' | 'info'

interface ToastItem {
  id: number
  title?: string
  message: string
  type: ToastType
}

interface ToastContextType {
  /** Hiện thông báo nổi góc phải, tự ẩn sau 4 giây. Mặc định type 'error'. */
  toast: (message: string, type?: ToastType, title?: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

/** Trần số toast hiển thị cùng lúc — giữ các toast mới nhất. */
const MAX_TOASTS = 4
/** Chống spam toast trùng nội dung (vd backend down → hàng loạt request fail). */
const DEDUP_MS = 4000
const DURATION_MS = 4000

/** Icon glyph theo type — character đơn giản trong badge tròn. */
function iconFor(type: ToastType): string {
  switch (type) {
    case 'success': return '✓'
    case 'error': return '!'
    default: return 'i'
  }
}

const DEFAULT_TITLES: Record<ToastType, string> = {
  error: 'Có lỗi xảy ra',
  success: 'Thành công',
  info: 'Thông báo',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)
  const lastShown = useRef(new Map<string, number>())

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message: string, type: ToastType = 'error', title?: string) => {
      const key = `${type}|${title ?? ''}|${message}`
      const now = Date.now()
      const prev = lastShown.current.get(key)
      if (prev !== undefined && now - prev < DEDUP_MS) return
      lastShown.current.set(key, now)

      const id = nextId.current++
      setToasts((curr) => [...curr, { id, title, message, type }].slice(-MAX_TOASTS))
      setTimeout(() => dismiss(id), DURATION_MS)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {toasts.length > 0 && (
        <div className="toast-stack" role="region" aria-live="polite">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`toast toast--${t.type}`}
              role="status"
              onClick={() => dismiss(t.id)}
            >
              <span className="toast-ico" aria-hidden="true">{iconFor(t.type)}</span>
              <div className="toast-body">
                <div className="toast-title">{t.title ?? DEFAULT_TITLES[t.type]}</div>
                <div className="toast-desc">{t.message}</div>
              </div>
              <button
                type="button"
                className="toast-close"
                aria-label="Đóng thông báo"
                onClick={(e) => {
                  e.stopPropagation()
                  dismiss(t.id)
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
