import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button, Input } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { PATHS } from '@/routes/paths'
import { getErrorMessage } from '@/utils/error'

export default function LoginPage() {
  const { isAuthenticated, login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [mode, setMode] = useState<'login' | 'register'>('login')

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const from = (location.state as { from?: string } | null)?.from

  if (isAuthenticated) return <Navigate to={from ?? PATHS.HOME} replace />

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(false)
    try {
      if (mode === 'login') {
        await login(username, password)
      } else {
        await register(username, email, password, phoneNumber)
      }
      navigate(from ?? PATHS.HOME, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const fillAdmin = () => {
    setMode('login')
    setUsername('admin')
    setPassword('admin123')
  }

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6">
          <button
            className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-colors ${
              mode === 'login'
                ? 'border-amber-600 text-amber-700 dark:text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
            onClick={() => {
              setMode('login')
              setError('')
            }}
          >
            Đăng Nhập
          </button>
          <button
            className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-colors ${
              mode === 'register'
                ? 'border-amber-600 text-amber-700 dark:text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
            onClick={() => {
              setMode('register')
              setError('')
            }}
          >
            Đăng Ký Tài Khoản
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-amber-100 mb-4">
            {mode === 'login' ? 'Chào Mừng Đến Với Thi Đàn' : 'Tạo Tài Khoản Độc Giả'}
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

          {error && <p className="text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/50 p-2.5 rounded-md border border-rose-200 dark:border-rose-900">{error}</p>}

          <Button type="submit" loading={loading}>
            {mode === 'login' ? 'Đăng nhập ngay' : 'Tạo tài khoản & Đăng nhập'}
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 text-center">
          <p className="text-xs text-slate-400 mb-2">Tài khoản thử nghiệm của Backend:</p>
          <button
            type="button"
            className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline"
            onClick={fillAdmin}
          >
            Điền sẵn tài khoản Admin (`admin` / `admin123`)
          </button>
        </div>
      </div>
    </div>
  )
}
