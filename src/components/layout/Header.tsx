import { NavLink, Link } from 'react-router-dom'
import { IconMoon, IconSun } from '@/components/ui/icons'
import { env } from '@/config/env'
import { useAuth, useTheme } from '@/hooks'
import { PATHS } from '@/routes/paths'

const NAV_ITEMS = [
  { to: PATHS.HOME, label: 'Trang chủ' },
  { to: PATHS.USERS, label: 'Người dùng' },
  { to: PATHS.POEMS, label: 'Bài viết' },
]

export function Header() {
  const { user, isAuthenticated } = useAuth()
  const { theme, toggle } = useTheme()

  return (
    <header className="topnav">
      <div className="topnav-inner">
        <Link to={PATHS.HOME} className="topnav-brand">
          <span className="topnav-logo">{env.APP_NAME.charAt(0)}</span>
          <span>{env.APP_NAME}</span>
        </Link>
        <nav className="topnav-links">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `topnav-link ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="topnav-right">
          <button
            className="topnav-theme-toggle"
            onClick={toggle}
            title={theme === 'dark' ? 'Chuyển giao diện sáng' : 'Chuyển giao diện tối'}
          >
            {theme === 'dark' ? <IconSun /> : <IconMoon />}
          </button>
          {isAuthenticated ? (
            <NavLink
              to={PATHS.PROFILE}
              className={({ isActive }) => `topnav-link ${isActive ? 'active' : ''}`}
            >
              👤 {user?.username}
            </NavLink>
          ) : (
            <NavLink
              to={PATHS.LOGIN}
              className={({ isActive }) => `topnav-link ${isActive ? 'active' : ''}`}
            >
              Đăng nhập
            </NavLink>
          )}
        </div>
      </div>
    </header>
  )
}
