import { Link, useLocation } from 'react-router-dom'
import { toPoemDetail } from '@/routes/paths'
import type { Poem } from '../types'

export function PoemCard({ poem }: { poem: Poem }) {
  const location = useLocation()
  const detailPath = toPoemDetail(poem.id)
  // Mang theo query của danh sách để nút "quay lại" ở trang chi tiết
  // trả về đúng trang/bộ lọc đang xem.
  const linkState = { listSearch: location.search }

  return (
    <article className="card card--hover poem-card">
      <div className="poem-card__head">
        <h3 className="poem-card__title">
          <Link to={detailPath} state={linkState}>
            {poem.title}
          </Link>
        </h3>
        <span className="badge">{poem.genre_name}</span>
      </div>
      <p className="card__meta">
        {poem.author_name} · {poem.period}
      </p>
      <p className="poem-card__excerpt">{poem.content}</p>
      <Link className="poem-card__more" to={detailPath} state={linkState}>
        Đọc bài viết →
      </Link>
    </article>
  )
}

/** Placeholder cùng khung với PoemCard khi đang tải danh sách. */
export function PoemCardSkeleton() {
  return (
    <div className="card poem-card">
      <span className="skeleton" style={{ height: 20, width: '72%' }} />
      <span className="skeleton" style={{ height: 13, width: '45%' }} />
      <span className="skeleton" style={{ height: 76 }} />
      <span className="skeleton" style={{ height: 14, width: 96 }} />
    </div>
  )
}
