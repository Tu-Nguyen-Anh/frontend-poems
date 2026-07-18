import { Link } from 'react-router-dom'
import { env } from '@/config/env'
import { PATHS } from '@/routes/paths'

export default function HomePage() {
  return (
    <div className="hero">
      <h1 className="hero__title">{env.APP_NAME}</h1>
      <p className="hero__subtitle">
        Base project React + TypeScript: kiến trúc feature-based, service kế thừa, đăng nhập
        access/refresh token, sẵn sàng mở rộng.
      </p>
      <div className="hero__actions">
        <Link className="button primary" to={PATHS.POEMS}>
          Xem bài viết theo chủ đề
        </Link>
        <Link className="button secondary" to={PATHS.USERS}>
          Feature mẫu: Users
        </Link>
      </div>
    </div>
  )
}
