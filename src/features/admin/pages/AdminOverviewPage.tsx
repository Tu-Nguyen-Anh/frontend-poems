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
        <h1 className="text-3xl font-serif font-bold text-[var(--c-gold)]">Tổng quan</h1>
        <p className="text-[var(--c-muted)] text-sm">Tổng quan số liệu toàn bộ hệ thống Tiểu Thi Hào</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <div className="p-6 rounded-xl bg-[var(--c-surface-2)] border border-[var(--c-border)] space-y-2">
          <p className="text-xs text-[var(--c-muted)] font-semibold uppercase">Bài thơ</p>
          <p className="text-3xl font-bold text-[var(--c-gold)]">{loading ? '...' : stats.poems}</p>
        </div>

        <div className="p-6 rounded-xl bg-[var(--c-surface-2)] border border-[var(--c-border)] space-y-2">
          <p className="text-xs text-[var(--c-muted)] font-semibold uppercase">Tác giả</p>
          <p className="text-3xl font-bold text-[var(--c-gold)]">{loading ? '...' : stats.authors}</p>
        </div>

        <div className="p-6 rounded-xl bg-[var(--c-surface-2)] border border-[var(--c-border)] space-y-2">
          <p className="text-xs text-[var(--c-muted)] font-semibold uppercase">Thể loại</p>
          <p className="text-3xl font-bold text-[var(--c-gold)]">{loading ? '...' : stats.genres}</p>
        </div>

        <div className="p-6 rounded-xl bg-[var(--c-surface-2)] border border-[var(--c-border)] space-y-2">
          <p className="text-xs text-[var(--c-muted)] font-semibold uppercase">Góp ý</p>
          <p className="text-3xl font-bold text-[var(--c-gold)]">{loading ? '...' : stats.feedbacks}</p>
        </div>

        <div className="p-6 rounded-xl bg-[var(--c-surface-2)] border border-[var(--c-border)] space-y-2">
          <p className="text-xs text-[var(--c-muted)] font-semibold uppercase">Người dùng</p>
          <p className="text-3xl font-bold text-[var(--c-gold)]">{loading ? '...' : stats.users}</p>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="p-8 rounded-xl bg-[var(--c-surface-2)] border border-[var(--c-border)] space-y-4">
        <h2 className="text-xl font-bold text-[var(--c-heading)]">Lối tắt quản lý</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to={PATHS.ADMIN_POEMS}
            className="p-4 rounded-lg bg-[var(--c-surface)] hover:border-[var(--c-gold)] border border-[var(--c-border)] transition-colors"
          >
            <p className="font-bold text-[var(--c-gold)]">Bài thơ</p>
            <p className="text-xs text-[var(--c-muted)] mt-1">Quản lý kho bài thơ</p>
          </Link>
          <Link
            to={PATHS.ADMIN_AUTHORS}
            className="p-4 rounded-lg bg-[var(--c-surface)] hover:border-[var(--c-gold)] border border-[var(--c-border)] transition-colors"
          >
            <p className="font-bold text-[var(--c-gold)]">Tác giả</p>
            <p className="text-xs text-[var(--c-muted)] mt-1">Thêm thi sĩ mới</p>
          </Link>
          <Link
            to={PATHS.ADMIN_FEEDBACKS}
            className="p-4 rounded-lg bg-[var(--c-surface)] hover:border-[var(--c-gold)] border border-[var(--c-border)] transition-colors"
          >
            <p className="font-bold text-[var(--c-gold)]">Góp ý</p>
            <p className="text-xs text-[var(--c-muted)] mt-1">Duyệt / từ chối phản hồi</p>
          </Link>
          <Link
            to={PATHS.ADMIN_USERS}
            className="p-4 rounded-lg bg-[var(--c-surface)] hover:border-[var(--c-gold)] border border-[var(--c-border)] transition-colors"
          >
            <p className="font-bold text-[var(--c-gold)]">Người dùng</p>
            <p className="text-xs text-[var(--c-muted)] mt-1">Quản lý quyền Admin/User</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
