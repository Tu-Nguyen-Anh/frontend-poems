import { Link, useLocation, useParams } from 'react-router-dom'
import { Button, Skeleton } from '@/components/ui'
import { PATHS } from '@/routes/paths'
import { usePoem } from '../hooks/usePoem'

export default function PoemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  // Query của danh sách do PoemCard truyền qua state → quay lại đúng trang/bộ lọc.
  const listSearch = (location.state as { listSearch?: string } | null)?.listSearch ?? ''
  const { data: poem, loading, error, refetch } = usePoem(id)

  return (
    <div className="poem-detail">
      <Link className="poem-detail__back" to={{ pathname: PATHS.POEMS, search: listSearch }}>
        ← Danh sách bài viết
      </Link>

      {loading && (
        <article className="card poem-detail__article">
          <div className="poem-detail__header">
            <Skeleton style={{ height: 28, width: '60%', margin: '0 auto 12px' }} />
            <Skeleton style={{ height: 14, width: '40%', margin: '0 auto' }} />
          </div>
          <div className="poem-detail__content">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} style={{ height: 16, width: `${88 - (i % 3) * 9}%`, margin: '12px auto' }} />
            ))}
          </div>
        </article>
      )}

      {error && (
        <div className="page page--center">
          <p className="text-error">{error}</p>
          <Button onClick={() => void refetch()}>Thử lại</Button>
        </div>
      )}

      {!loading && poem && (
        <article className="card poem-detail__article">
          <header className="poem-detail__header">
            <h1>{poem.title}</h1>
            <p className="poem-detail__meta">
              <strong>{poem.author_name}</strong>
              <span aria-hidden="true">·</span>
              <span>{poem.period}</span>
              <span aria-hidden="true">·</span>
              <span>{poem.specific_genre}</span>
              <span className="badge">{poem.genre_name}</span>
            </p>
          </header>
          <div className="poem-detail__content">{poem.content}</div>
          {poem.source_url && (
            <footer className="poem-detail__source">
              Nguồn:{' '}
              <a href={poem.source_url} target="_blank" rel="noreferrer">
                {poem.source_url}
              </a>
            </footer>
          )}
        </article>
      )}
    </div>
  )
}
