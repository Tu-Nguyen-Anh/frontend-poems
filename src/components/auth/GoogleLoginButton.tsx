import { useEffect, useRef, useState, useCallback } from 'react'
import { env } from '@/config/env'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/contexts/ToastContext'
import { getErrorMessage } from '@/utils/error'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string; select_by?: string }) => void
            auto_select?: boolean
            cancel_on_tap_outside?: boolean
          }) => void
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon'
              theme?: 'outline' | 'filled_blue' | 'filled_black'
              size?: 'large' | 'medium' | 'small'
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
              shape?: 'rectangular' | 'pill' | 'circle' | 'square'
              logo_alignment?: 'left' | 'center'
              width?: string | number
              locale?: string
            }
          ) => void
          prompt?: (momentListener?: (notification: unknown) => void) => void
        }
      }
    }
  }
}

interface GoogleLoginButtonProps {
  onSuccess?: () => void
  onError?: (error: unknown) => void
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  shape?: 'rectangular' | 'pill'
  size?: 'large' | 'medium' | 'small'
  width?: string | number
  className?: string
  /** Bật One-tap prompt tự động bật lên góc trên */
  enableOneTap?: boolean
}

export function GoogleLoginButton({
  onSuccess,
  onError,
  text = 'continue_with',
  shape = 'rectangular',
  size = 'large',
  width,
  className = '',
  enableOneTap = false,
}: GoogleLoginButtonProps) {
  const { loginWithGoogle } = useAuth()
  const { toast } = useToast()
  const buttonRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [isRendered, setIsRendered] = useState(false)

  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      if (!response?.credential) {
        toast('Không nhận được mã xác thực từ Google.', 'error')
        return
      }

      setLoading(true)
      try {
        await loginWithGoogle(response.credential)
        toast('Đăng nhập bằng Google thành công!', 'success')
        onSuccess?.()
      } catch (err) {
        const msg = getErrorMessage(err)
        toast(`Đăng nhập Google thất bại: ${msg}`, 'error')
        onError?.(err)
      } finally {
        setLoading(false)
      }
    },
    [loginWithGoogle, toast, onSuccess, onError],
  )

  // Load Google Identity Services script if not already in document
  useEffect(() => {
    if (window.google?.accounts?.id) {
      setScriptLoaded(true)
      return
    }

    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => setScriptLoaded(true))
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => setScriptLoaded(true)
    script.onerror = () => console.warn('Không thể tải Google Identity Services script')
    document.head.appendChild(script)
  }, [])

  // Initialize and Render Button
  useEffect(() => {
    if (!scriptLoaded || !window.google?.accounts?.id || !buttonRef.current) return
    const clientId = env.GOOGLE_CLIENT_ID
    if (!clientId) {
      console.warn('Thiếu GOOGLE_CLIENT_ID trong cấu hình môi trường')
      return
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      })

      // Detect dark theme
      const isDark =
        document.documentElement.classList.contains('dark') ||
        document.documentElement.getAttribute('data-theme') === 'dark' ||
        document.documentElement.getAttribute('data-reader-mode') === 'modern-dark'

      // Clear previous rendered button if any
      buttonRef.current.innerHTML = ''

      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: isDark ? 'filled_black' : 'outline',
        size,
        text,
        shape,
        logo_alignment: 'left',
        width: width ?? '100%',
        locale: 'vi',
      })

      setIsRendered(true)

      if (enableOneTap) {
        window.google.accounts.id.prompt?.()
      }
    } catch (e) {
      console.error('Lỗi khi render nút Google Sign-In:', e)
    }
  }, [scriptLoaded, handleCredentialResponse, size, text, shape, width, enableOneTap])

  return (
    <div className={`relative flex flex-col items-center justify-center w-full ${className}`}>
      {loading && (
        <div className="absolute inset-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-[1px] rounded-lg flex items-center justify-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
          <span className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <span>Đang xác thực Google...</span>
        </div>
      )}

      {/* Container where Google renders official button */}
      <div
        ref={buttonRef}
        className="w-full flex justify-center min-h-[40px] [&>div]:!w-full [&>div>iframe]:!w-full"
      />

      {/* Fallback button if GIS script blocked or taking time */}
      {!isRendered && (
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            if (window.google?.accounts?.id) {
              window.google.accounts.id.prompt?.()
            } else {
              toast('Đang tải dịch vụ Google Sign-In, vui lòng thử lại sau giây lát...', 'info')
            }
          }}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Đăng nhập với Google</span>
        </button>
      )}
    </div>
  )
}
