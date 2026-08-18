import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button, Input } from '@/components/ui'
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton'
import { useAuth } from '@/hooks/useAuth'
import { PATHS } from '@/routes/paths'
import { getErrorMessage } from '@/utils/error'
import { useToast } from '@/contexts/ToastContext'
import { Seo } from '@/components/common/Seo'

export default function LoginPage() {
  const { isAuthenticated, login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  // Tab đồng bộ với URL: /register → tab Đăng ký, còn lại → tab Đăng nhập.
  const mode: 'login' | 'register' =
    location.pathname === PATHS.REGISTER ? 'register' : 'login'
  const setMode = (next: 'login' | 'register') => {
    // Giữ location.state (from) để sau đăng nhập quay lại trang cũ
    navigate(next === 'register' ? PATHS.REGISTER : PATHS.LOGIN, {
      replace: true,
      state: location.state,
    })
  }

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')

  const [loading, setLoading] = useState(false)

  const from = (location.state as { from?: string } | null)?.from

  if (isAuthenticated) return <Navigate to={from ?? PATHS.HOME} replace />

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(username.trim(), password)
      } else {
        await register(username.trim(), email.trim(), password, phoneNumber.trim())
      }
      navigate(from ?? PATHS.HOME, { replace: true })
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = () => {
    navigate(from ?? PATHS.HOME, { replace: true })
  }

  return (
    <div className="max-w-md mx-auto py-12">
      <Seo title={mode === 'login' ? 'Đăng nhập' : 'Đăng ký tài khoản'} noindex />
      <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6">
          <button
            className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-colors ${
              mode === 'login'
                ? 'border-amber-600 text-amber-700 dark:text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
            onClick={() => setMode('login')}
          >
            Đăng Nhập
          </button>
          <button
            className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-colors ${
              mode === 'register'
                ? 'border-amber-600 text-amber-700 dark:text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
            onClick={() => setMode('register')}
          >
            Đăng Ký Tài Khoản
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-amber-100 mb-4">
            {mode === 'login' ? 'Chào Mừng Đến Với Tiểu Thi Hào' : 'Tạo Tài Khoản Độc Giả'}
          </h2>

          <Input
            label="Tên đăng nhập"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            autoFocus
          />

          {mode === 'register' && (
            <>
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="example@gmail.com"
                required
              />
              <Input
                label="Số điện thoại"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="0987654321"
              />
            </>
          )}

          <Input
            label="Mật khẩu"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <Button type="submit" loading={loading} className="w-full">
            {mode === 'login' ? 'Đăng nhập ngay' : 'Tạo tài khoản & Đăng nhập'}
          </Button>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400 pt-1">
            {mode === 'login' ? (
              <>
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="font-semibold text-amber-700 dark:text-amber-400 hover:underline"
                >
                  Đăng ký ngay
                </button>
              </>
            ) : (
              <>
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-semibold text-amber-700 dark:text-amber-400 hover:underline"
                >
                  Đăng nhập
                </button>
              </>
            )}
          </p>
        </form>

        {/* Google Sign-in Section */}
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="relative flex items-center justify-center mb-4">
            <span className="bg-white dark:bg-slate-800 px-3 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Hoặc tiếp tục với
            </span>
          </div>
          <GoogleLoginButton
            onSuccess={handleGoogleSuccess}
            text={mode === 'login' ? 'signin_with' : 'signup_with'}
            shape="rectangular"
            size="large"
          />
        </div>
      </div>
    </div>
  )
}

