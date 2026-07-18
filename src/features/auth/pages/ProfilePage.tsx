import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'
import { useAuth } from '@/hooks'
import { PATHS } from '@/routes/paths'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      await logout()
      navigate(PATHS.LOGIN, { replace: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page page--center">
      <div className="card card--accent auth-form">
        <h1>Tài khoản</h1>
        <p>
          Tên đăng nhập: <strong>{user?.username}</strong>
        </p>
        <p>
          Vai trò: <strong>{user?.roles.join(', ') || '—'}</strong>
        </p>
        <Button variant="danger" loading={loading} onClick={() => void handleLogout()}>
          Đăng xuất
        </Button>
      </div>
    </div>
  )
}
