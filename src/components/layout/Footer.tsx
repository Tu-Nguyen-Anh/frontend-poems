import { Link } from 'react-router-dom'
import { PATHS } from '@/routes/paths'

export function Footer() {
  return (
    <footer className="border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950 py-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <span className="block mb-3 text-xl font-serif font-bold text-slate-900 dark:text-amber-100">
            Thi Đàn
          </span>
          <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md leading-relaxed">
            Kho tàng thơ ca Việt Nam — lưu giữ và chia sẻ, với chế độ đọc cổ điển và hiện đại.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-800 dark:text-amber-200 mb-3">
            Khám Phá
          </h4>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li>
              <Link to={PATHS.POEMS} className="hover:text-amber-600 dark:hover:text-amber-400 transition">
                Kho Bài Thơ
              </Link>
            </li>
            <li>
              <Link to={PATHS.AUTHORS} className="hover:text-amber-600 dark:hover:text-amber-400 transition">
                Danh Sách Tác Giả
              </Link>
            </li>
            <li>
              <Link to={PATHS.GENRES} className="hover:text-amber-600 dark:hover:text-amber-400 transition">
                Thể Loại Thơ
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-800 dark:text-amber-200 mb-3">
            Hệ Thống
          </h4>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li>
              <Link to={PATHS.LOGIN} className="hover:text-amber-600 dark:hover:text-amber-400 transition">
                Đăng Nhập
              </Link>
            </li>
            <li>
              <Link to={PATHS.REGISTER} className="hover:text-amber-600 dark:hover:text-amber-400 transition">
                Đăng Ký
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-slate-200/40 dark:border-slate-800/40 text-center text-xs text-slate-500 dark:text-slate-500">
        © {new Date().getFullYear()} Thi Đàn. Kho tàng thơ ca Việt Nam.
      </div>
    </footer>
  )
}
