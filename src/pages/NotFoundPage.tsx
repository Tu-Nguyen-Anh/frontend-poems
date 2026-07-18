import { Link } from 'react-router-dom'
import { PATHS } from '@/routes/paths'

export default function NotFoundPage() {
  return (
    <div className="page page--center">
      <h1>404</h1>
      <p>Trang bạn tìm không tồn tại.</p>
      <Link className="button primary" to={PATHS.HOME}>
        Về trang chủ
      </Link>
    </div>
  )
}
