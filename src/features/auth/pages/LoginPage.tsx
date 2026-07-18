import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button, Input } from '@/components/ui'
import { useAuth } from '@/hooks'
import { PATHS } from '@/routes/paths'
import { getErrorMessage } from '@/utils/error'

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const from = (location.state as { from?: string } | null)?.from

  // Đã đăng nhập (kể cả vừa xong) → về trang đích; guard này phải dùng `from`
  // vì nó có thể render trước khi navigate() trong handleSubmit kịp chạy.
  if (isAuthenticated) return <Navigate to={from ?? PATHS.HOME} replace />

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate(from ?? PATHS.HOME, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page page--center">
      <form className="card card--accent auth-form" onSubmit={handleSubmit}>
        <h1>Đăng nhập</h1>
        <Input
          label="Tên đăng nhập"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
          autoFocus
        />
        <Input
          label="Mật khẩu"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        {error && <p className="text-error">{error}</p>}
        <Button type="submit" loading={loading}>
          Đăng nhập
        </Button>
      </form>
    </div>
  )
}
