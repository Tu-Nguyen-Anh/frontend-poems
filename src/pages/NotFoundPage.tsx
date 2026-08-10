import { Link } from 'react-router-dom'
import { PATHS } from '@/routes/paths'

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-6">
      <div className="text-8xl select-none animate-bounce">📜</div>
      <h1 className="text-5xl font-serif font-bold text-slate-900 dark:text-amber-100">404</h1>
      <p className="text-slate-600 dark:text-slate-400 text-base max-w-md">
        Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển sang địa chỉ khác.
      </p>
      <Link
        to={PATHS.HOME}
        className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl shadow-lg transition transform active:scale-95"
      >
        ← Trở về Trang Chủ
      </Link>
    </div>
  )
}
