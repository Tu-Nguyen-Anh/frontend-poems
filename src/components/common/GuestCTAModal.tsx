import { useNavigate } from 'react-router-dom'
import { useGuestCTAModal } from '@/contexts/GuestCTAModalContext'
import { PATHS } from '@/routes/paths'
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton'

export function GuestCTAModal() {
  const { isOpen, actionName, closeModal } = useGuestCTAModal()
  
  let navigate: (path: string) => void
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const nav = useNavigate()
    navigate = nav
  } catch {
    navigate = (path: string) => {
      window.location.href = path
    }
  }

  if (!isOpen) return null

  const handleLogin = () => {
    closeModal()
    navigate(PATHS.LOGIN)
  }

  const handleRegister = () => {
    closeModal()
    navigate(PATHS.REGISTER)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-xl p-6 shadow-lg border border-amber-500/20 text-center">
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Đóng"
        >
          ✕
        </button>

        <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-amber-100 mb-2">
          Tham gia cùng độc giả
        </h3>

        <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 leading-relaxed">
          Đăng nhập để <strong>{actionName}</strong>, bình luận và gửi phản hồi cho tác giả.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
          <button
            onClick={handleLogin}
            className="w-full sm:w-1/2 py-2.5 px-4 bg-amber-700 hover:bg-amber-800 text-white font-medium rounded-md transition-colors"
          >
            Đăng nhập
          </button>
          <button
            onClick={handleRegister}
            className="w-full sm:w-1/2 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium rounded-md transition-colors border border-slate-200 dark:border-slate-700"
          >
            Đăng ký
          </button>
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-700/80">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 mb-2.5 font-medium">
            Hoặc đăng nhập nhanh
          </p>
          <GoogleLoginButton
            onSuccess={closeModal}
            text="signin_with"
            shape="rectangular"
            size="medium"
          />
        </div>
      </div>
    </div>
  )
}
