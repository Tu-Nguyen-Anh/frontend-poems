import { useState, useEffect, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button, Input } from '@/components/ui'
import {
  IconEye,
  IconEyeOff,
  IconMail,
  IconLock,
  IconShieldCheck,
  IconArrowLeft,
  IconRefresh,
} from '@/components/ui/icons'
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton'
import { useAuth } from '@/hooks/useAuth'
import { PATHS } from '@/routes/paths'
import { getErrorMessage } from '@/utils/error'
import { useToast } from '@/contexts/ToastContext'
import { Seo } from '@/components/common/Seo'

type AuthMode = 'login' | 'register' | 'verify-email' | 'forgot-password' | 'reset-password'

export default function LoginPage() {
  const {
    isAuthenticated,
    login,
    register,
    verifyOtp,
    forgotPassword,
    resetPassword,
  } = useAuth()

  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  // Xác định auth mode từ URL hiện tại
  const getModeFromPath = (pathname: string): AuthMode => {
    if (pathname === PATHS.REGISTER) return 'register'
    if (pathname === PATHS.VERIFY_EMAIL) return 'verify-email'
    if (pathname === PATHS.FORGOT_PASSWORD) return 'forgot-password'
    if (pathname === PATHS.RESET_PASSWORD) return 'reset-password'
    return 'login'
  }

  const mode = getModeFromPath(location.pathname)

  const setMode = (next: AuthMode) => {
    let targetPath: string = PATHS.LOGIN
    if (next === 'register') targetPath = PATHS.REGISTER
    else if (next === 'verify-email') targetPath = PATHS.VERIFY_EMAIL
    else if (next === 'forgot-password') targetPath = PATHS.FORGOT_PASSWORD
    else if (next === 'reset-password') targetPath = PATHS.RESET_PASSWORD

    navigate(targetPath, {
      replace: true,
      state: location.state,
    })
  }

  // State các trường thông tin
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')

  // State hiển thị mật khẩu
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)

  // Loading & countdown
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)

  const from = (location.state as { from?: string } | null)?.from

  // Timer đếm ngược khi gửi OTP
  useEffect(() => {
    if (resendCountdown <= 0) return
    const timer = setInterval(() => {
      setResendCountdown((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCountdown])

  if (isAuthenticated) {
    return <Navigate to={from ?? PATHS.HOME} replace />
  }

  // --- Handlers ---

  // 1. Đăng nhập thông thường
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) {
      toast('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.', 'error')
      return
    }

    setLoading(true)
    try {
      await login(username.trim(), password)
      toast('Đăng nhập thành công!', 'success')
      navigate(from ?? PATHS.HOME, { replace: true })
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  // 2. Đăng ký tài khoản (Gửi thông tin -> Backend gửi OTP qua email)
  const handleRegister = async (e: FormEvent) => {
    e.preventDefault()
    const cleanUsername = username.trim()
    const cleanEmail = email.trim()
    const cleanPhone = phoneNumber.trim()

    if (!cleanUsername || !cleanEmail || !password) {
      toast('Vui lòng nhập đầy đủ tên đăng nhập, email và mật khẩu.', 'error')
      return
    }
    if (password.length < 8) {
      toast('Mật khẩu phải có ít nhất 8 ký tự.', 'error')
      return
    }
    if (password !== confirmPassword) {
      toast('Mật khẩu xác nhận không khớp.', 'error')
      return
    }

    setLoading(true)
    try {
      await register(cleanUsername, cleanEmail, password, cleanPhone)
      toast('Mã OTP xác thực đã được gửi đến email của bạn. Vui lòng kiểm tra!', 'success')
      setResendCountdown(60)
      setOtp('')
      setMode('verify-email')
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  // 3. Xác thực OTP hoàn tất đăng ký
  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault()
    const cleanEmail = email.trim()
    const cleanOtp = otp.trim()

    if (!cleanEmail) {
      toast('Vui lòng nhập địa chỉ email cần xác thực.', 'error')
      return
    }
    if (!cleanOtp) {
      toast('Vui lòng nhập mã OTP 6 chữ số.', 'error')
      return
    }
    if (cleanOtp.length !== 6) {
      toast('Mã OTP phải bao gồm đúng 6 chữ số.', 'error')
      return
    }

    setLoading(true)
    try {
      await verifyOtp(cleanEmail, cleanOtp, username.trim() || undefined)
      toast('Đăng ký và xác thực tài khoản thành công!', 'success')
      navigate(from ?? PATHS.HOME, { replace: true })
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  // 4. Gửi lại OTP đăng ký
  const handleResendRegisterOtp = async () => {
    if (resendCountdown > 0 || resendLoading) return
    const cleanEmail = email.trim()
    const cleanUsername = username.trim()

    if (!cleanEmail || !cleanUsername || !password) {
      toast('Thiếu thông tin đăng ký để gửi lại mã. Vui lòng điền lại biểu mẫu đăng ký.', 'error')
      setMode('register')
      return
    }

    setResendLoading(true)
    try {
      await register(cleanUsername, cleanEmail, password, phoneNumber.trim())
      toast('Đã gửi lại mã OTP xác thực mới đến email của bạn!', 'success')
      setResendCountdown(60)
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    } finally {
      setResendLoading(false)
    }
  }

  // 5. Quên mật khẩu (Gửi email để nhận OTP reset)
  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault()
    const cleanEmail = email.trim()
    if (!cleanEmail) {
      toast('Vui lòng nhập địa chỉ email của bạn.', 'error')
      return
    }

    setLoading(true)
    try {
      await forgotPassword(cleanEmail)
      toast('Mã xác thực đặt lại mật khẩu đã được gửi đến email của bạn!', 'success')
      setResendCountdown(60)
      setOtp('')
      setMode('reset-password')
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  // 6. Đặt lại mật khẩu mới với OTP
  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault()
    const cleanEmail = email.trim()
    const cleanOtp = otp.trim()

    if (!cleanEmail) {
      toast('Vui lòng nhập địa chỉ email.', 'error')
      return
    }
    if (!cleanOtp) {
      toast('Vui lòng nhập mã xác thực OTP.', 'error')
      return
    }
    if (cleanOtp.length !== 6) {
      toast('Mã OTP phải bao gồm đúng 6 chữ số.', 'error')
      return
    }
    if (!newPassword) {
      toast('Vui lòng nhập mật khẩu mới.', 'error')
      return
    }
    if (newPassword.length < 8) {
      toast('Mật khẩu mới phải có ít nhất 8 ký tự.', 'error')
      return
    }
    if (newPassword !== confirmNewPassword) {
      toast('Mật khẩu xác nhận không trùng khớp.', 'error')
      return
    }

    setLoading(true)
    try {
      await resetPassword(cleanEmail, cleanOtp, newPassword)
      toast('Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.', 'success')
      setPassword('')
      setOtp('')
      setNewPassword('')
      setConfirmNewPassword('')
      setMode('login')
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  // 7. Gửi lại OTP quên mật khẩu
  const handleResendForgotOtp = async () => {
    if (resendCountdown > 0 || resendLoading) return
    const cleanEmail = email.trim()
    if (!cleanEmail) {
      toast('Vui lòng nhập địa chỉ email để nhận lại mã OTP.', 'error')
      return
    }

    setResendLoading(true)
    try {
      await forgotPassword(cleanEmail)
      toast('Đã gửi lại mã OTP đặt lại mật khẩu đến email của bạn!', 'success')
      setResendCountdown(60)
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    } finally {
      setResendLoading(false)
    }
  }

  const handleGoogleSuccess = () => {
    navigate(from ?? PATHS.HOME, { replace: true })
  }

  // Tiêu đề trang
  const getPageTitle = () => {
    switch (mode) {
      case 'register':
        return 'Đăng ký tài khoản'
      case 'verify-email':
        return 'Xác thực tài khoản'
      case 'forgot-password':
        return 'Quên mật khẩu'
      case 'reset-password':
        return 'Đặt lại mật khẩu'
      default:
        return 'Đăng nhập'
    }
  }

  return (
    <div className="max-w-md mx-auto py-10 px-4 sm:px-0">
      <Seo title={getPageTitle()} noindex />
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-700">
        {/* Navigation Tabs (chỉ hiện khi ở tab Login hoặc Register) */}
        {(mode === 'login' || mode === 'register') && (
          <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6">
            <button
              type="button"
              className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-colors ${
                mode === 'login'
                  ? 'border-amber-600 text-amber-700 dark:text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              onClick={() => setMode('login')}
            >
              Đăng Nhập
            </button>
            <button
              type="button"
              className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-colors ${
                mode === 'register'
                  ? 'border-amber-600 text-amber-700 dark:text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              onClick={() => setMode('register')}
            >
              Đăng Ký Tài Khoản
            </button>
          </div>
        )}

        {/* Back Button (khi ở các màn hình OTP, Forgot, Reset) */}
        {mode !== 'login' && mode !== 'register' && (
          <div className="mb-6">
            <button
              type="button"
              onClick={() => {
                if (mode === 'verify-email') setMode('register')
                else if (mode === 'reset-password') setMode('forgot-password')
                else setMode('login')
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline transition-colors"
            >
              <IconArrowLeft size={14} />
              <span>
                {mode === 'verify-email'
                  ? 'Quay lại đăng ký'
                  : mode === 'reset-password'
                  ? 'Quay lại Quên mật khẩu'
                  : 'Quay lại Đăng nhập'}
              </span>
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* 1. MÀN HÌNH ĐĂNG NHẬP */}
        {/* ========================================================= */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="mb-4">
              <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-amber-100">
                Chào Mừng Trở Lại
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Đăng nhập để bình luận, lưu thơ yêu thích và sáng tác.
              </p>
            </div>

            <Input
              label="Tên đăng nhập"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập username"
              required
              autoFocus
            />

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Mật khẩu
                </label>
                <button
                  type="button"
                  onClick={() => setMode('forgot-password')}
                  className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  required
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-900 dark:text-slate-100 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full !mt-5">
              Đăng nhập ngay
            </Button>

            <p className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2">
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="font-semibold text-amber-700 dark:text-amber-400 hover:underline"
              >
                Đăng ký ngay
              </button>
            </p>
          </form>
        )}

        {/* ========================================================= */}
        {/* 2. MÀN HÌNH ĐĂNG KÝ */}
        {/* ========================================================= */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="mb-4">
              <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-amber-100">
                Tạo Tài Khoản Độc Giả
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Nhập thông tin bên dưới để nhận mã OTP xác thực email.
              </p>
            </div>

            <Input
              label="Tên đăng nhập *"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ví dụ: nguyenvana"
              required
              autoFocus
            />

            <div>
              <Input
                label="Email *"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                required
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                * Mã OTP 6 chữ số sẽ được gửi về email này để kích hoạt tài khoản.
              </p>
            </div>

            <Input
              label="Số điện thoại"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="0987654321 (không bắt buộc)"
            />

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Mật khẩu *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 8 ký tự"
                  required
                  minLength={8}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-900 dark:text-slate-100 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Nhập lại mật khẩu *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu vừa đặt"
                  required
                  minLength={8}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-900 dark:text-slate-100 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showConfirmPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full !mt-5">
              Đăng ký & Nhận mã OTP
            </Button>

            <p className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2">
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="font-semibold text-amber-700 dark:text-amber-400 hover:underline"
              >
                Đăng nhập
              </button>
            </p>
          </form>
        )}

        {/* ========================================================= */}
        {/* 3. MÀN HÌNH XÁC THỰC OTP ĐĂNG KÝ EMAIL */}
        {/* ========================================================= */}
        {mode === 'verify-email' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 mx-auto flex items-center justify-center border border-amber-300 dark:border-amber-700">
                <IconShieldCheck size={24} />
              </div>
              <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-amber-100">
                Xác Thực Tài Khoản
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed px-2">
                Mã xác thực gồm 6 chữ số đã được gửi đến:
                <br />
                <span className="font-bold text-amber-700 dark:text-amber-400 text-sm">
                  {email || 'email của bạn'}
                </span>
              </p>
            </div>

            {!email && (
              <Input
                label="Email xác thực"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email của bạn"
                required
              />
            )}

            <div className="space-y-2">
              <label className="block text-center text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Nhập mã OTP (6 chữ số)
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                className="w-full text-center text-2xl font-mono tracking-[0.4em] px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-amber-400 dark:border-amber-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 dark:text-amber-200"
                autoFocus
                required
              />
              <p className="text-[11px] text-center text-slate-400">
                Mã OTP có hiệu lực trong 5 phút. Vui lòng kiểm tra cả hòm thư Spam nếu chưa thấy.
              </p>
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Xác nhận & Hoàn tất
            </Button>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
              <button
                type="button"
                onClick={handleResendRegisterOtp}
                disabled={resendCountdown > 0 || resendLoading}
                className="inline-flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400 hover:underline disabled:opacity-50 disabled:no-underline"
              >
                <IconRefresh size={14} className={resendLoading ? 'animate-spin' : ''} />
                <span>
                  {resendCountdown > 0
                    ? `Gửi lại mã (${resendCountdown}s)`
                    : resendLoading
                    ? 'Đang gửi...'
                    : 'Gửi lại mã OTP'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:underline"
              >
                Đổi thông tin đăng ký
              </button>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* 4. MÀN HÌNH QUÊN MẬT KHẨU */}
        {/* ========================================================= */}
        {mode === 'forgot-password' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="text-center space-y-2 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 mx-auto flex items-center justify-center border border-amber-300 dark:border-amber-700">
                <IconLock size={22} />
              </div>
              <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-amber-100">
                Quên Mật Khẩu
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed px-2">
                Nhập email liên kết với tài khoản. Hệ thống sẽ gửi mã OTP 6 chữ số để bạn đặt lại mật khẩu.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Địa chỉ email tài khoản *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <IconMail size={16} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full !mt-5">
              Gửi mã xác thực OTP
            </Button>

            <p className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2">
              Nhớ lại mật khẩu rồi?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="font-semibold text-amber-700 dark:text-amber-400 hover:underline"
              >
                Đăng nhập ngay
              </button>
            </p>
          </form>
        )}

        {/* ========================================================= */}
        {/* 5. MÀN HÌNH ĐẶT LẠI MẬT KHẨU MỚI */}
        {/* ========================================================= */}
        {mode === 'reset-password' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="text-center space-y-2 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 mx-auto flex items-center justify-center border border-amber-300 dark:border-amber-700">
                <IconShieldCheck size={24} />
              </div>
              <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-amber-100">
                Đặt Lại Mật Khẩu Mới
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 px-2 leading-relaxed">
                Nhập mã OTP đã gửi đến{' '}
                <span className="font-bold text-amber-700 dark:text-amber-400">
                  {email || 'email của bạn'}
                </span>{' '}
                và tạo mật khẩu mới.
              </p>
            </div>

            <Input
              label="Email *"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Mã OTP (6 chữ số) *
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                required
                className="w-full text-center text-lg font-mono tracking-[0.3em] font-bold px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-amber-400 dark:border-amber-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-amber-200"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Mật khẩu mới *
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 8 ký tự"
                  required
                  minLength={8}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-900 dark:text-slate-100 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  tabIndex={-1}
                  aria-label={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showNewPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Nhập lại mật khẩu mới *
              </label>
              <div className="relative">
                <input
                  type={showConfirmNewPassword ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                  minLength={8}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-900 dark:text-slate-100 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  tabIndex={-1}
                  aria-label={showConfirmNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showConfirmNewPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full !mt-5">
              Đổi mật khẩu
            </Button>

            <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-700/60">
              <button
                type="button"
                onClick={handleResendForgotOtp}
                disabled={resendCountdown > 0 || resendLoading}
                className="inline-flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400 hover:underline disabled:opacity-50 disabled:no-underline"
              >
                <IconRefresh size={14} className={resendLoading ? 'animate-spin' : ''} />
                <span>
                  {resendCountdown > 0
                    ? `Gửi lại mã OTP (${resendCountdown}s)`
                    : resendLoading
                    ? 'Đang gửi...'
                    : 'Gửi lại mã OTP'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:underline"
              >
                Hủy & Đăng nhập
              </button>
            </div>
          </form>
        )}

        {/* Google Sign-in Section (Chỉ hiển thị ở chế độ login hoặc register) */}
        {(mode === 'login' || mode === 'register') && (
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
        )}
      </div>
    </div>
  )
}

