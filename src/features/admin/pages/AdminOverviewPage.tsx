import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { poemService } from '@/services/poem.service'
import { authorService } from '@/services/author.service'
import { genreService } from '@/services/genre.service'
import { feedbackService } from '@/services/feedback.service'
import { userService } from '@/services/user.service'
import { PATHS } from '@/routes/paths'

export default function AdminOverviewPage() {
  const [stats, setStats] = useState({
    poems: 0,
    authors: 0,
    genres: 0,
    feedbacks: 0,
    users: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      setLoading(true)
      try {
        const [poems, authors, genres, feedbacks, users] = await Promise.allSettled([
          poemService.getPoems({ size: 1 }),
          authorService.getAuthors({ size: 1, isAll: true }),
          genreService.getGenres({ size: 1, isAll: true }),
          feedbackService.getFeedbacks({ size: 1, isAll: true }),
          userService.getUsers({ size: 1, isAll: true }),
        ])

        setStats({
          poems: poems.status === 'fulfilled' ? poems.value.amount || 0 : 0,
          authors: authors.status === 'fulfilled' ? authors.value.amount || 0 : 0,
          genres: genres.status === 'fulfilled' ? genres.value.amount || 0 : 0,
          feedbacks: feedbacks.status === 'fulfilled' ? feedbacks.value.amount || 0 : 0,
          users: users.status === 'fulfilled' ? users.value.amount || 0 : 0,
        })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-amber-400">📊 Admin Overview</h1>
        <p className="text-slate-400 text-sm">Tổng quan số liệu toàn bộ hệ thống Thi Đàn</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <span className="text-2xl">📜</span>
          <p className="text-xs text-slate-400 font-semibold uppercase">Bài Thơ</p>
          <p className="text-3xl font-bold text-amber-400">{loading ? '...' : stats.poems}</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <span className="text-2xl">✍️</span>
          <p className="text-xs text-slate-400 font-semibold uppercase">Tác Giả</p>
          <p className="text-3xl font-bold text-amber-400">{loading ? '...' : stats.authors}</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <span className="text-2xl">🏷️</span>
          <p className="text-xs text-slate-400 font-semibold uppercase">Thể Loại</p>
          <p className="text-3xl font-bold text-amber-400">{loading ? '...' : stats.genres}</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <span className="text-2xl">📩</span>
          <p className="text-xs text-slate-400 font-semibold uppercase">Góp Ý</p>
          <p className="text-3xl font-bold text-amber-400">{loading ? '...' : stats.feedbacks}</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <span className="text-2xl">👥</span>
          <p className="text-xs text-slate-400 font-semibold uppercase">Người Dùng</p>
          <p className="text-3xl font-bold text-amber-400">{loading ? '...' : stats.users}</p>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-xl font-bold text-slate-100">🚀 Lối Tắt Quản Lý</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to={PATHS.ADMIN_POEMS}
            className="p-4 rounded-xl bg-slate-800 hover:bg-amber-600/20 hover:border-amber-500 border border-slate-700 transition"
          >
            <p className="font-bold text-amber-400">📜 Thêm/Sửa Bài Thơ</p>
            <p className="text-xs text-slate-400 mt-1">Quản lý kho bài thơ</p>
          </Link>
          <Link
            to={PATHS.ADMIN_AUTHORS}
            className="p-4 rounded-xl bg-slate-800 hover:bg-amber-600/20 hover:border-amber-500 border border-slate-700 transition"
          >
            <p className="font-bold text-amber-400">✍️ Quản Lý Tác Giả</p>
            <p className="text-xs text-slate-400 mt-1">Thêm thi sĩ mới</p>
          </Link>
          <Link
            to={PATHS.ADMIN_FEEDBACKS}
            className="p-4 rounded-xl bg-slate-800 hover:bg-amber-600/20 hover:border-amber-500 border border-slate-700 transition"
          >
            <p className="font-bold text-amber-400">📩 Duyệt Góp Ý</p>
            <p className="text-xs text-slate-400 mt-1">Duyệt/Từ chối phản hồi</p>
          </Link>
          <Link
            to={PATHS.ADMIN_USERS}
            className="p-4 rounded-xl bg-slate-800 hover:bg-amber-600/20 hover:border-amber-500 border border-slate-700 transition"
          >
            <p className="font-bold text-amber-400">👥 Phân Quyền User</p>
            <p className="text-xs text-slate-400 mt-1">Quản lý quyền Admin/User</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
