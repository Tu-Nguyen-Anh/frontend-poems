import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, Pagination } from '@/components/ui'
import { IconSearch } from '@/components/ui/icons'
import { useDebounce } from '@/hooks'
import { GenreFilter } from '../components/GenreFilter'
import { PoemCard, PoemCardSkeleton } from '../components/PoemCard'
import { POEM_PAGE_SIZE } from '../constants'
import { usePoems } from '../hooks/usePoems'

/** Bộ lọc nằm trên URL (?q=&author=&genre=&page=) → share link / back-forward giữ nguyên trạng thái. */
export default function PoemsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const keyword = searchParams.get('q') ?? ''
  const author = searchParams.get('author') ?? ''
  const genreParam = searchParams.get('genre')
  const genreId = genreParam ? Number(genreParam) : null
  const page = Math.max(0, Number(searchParams.get('page')) || 0)

  const [input, setInput] = useState(keyword)
  const [authorInput, setAuthorInput] = useState(author)
  const debouncedInput = useDebounce(input)
  const debouncedAuthor = useDebounce(authorInput)

  const updateParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === '') next.delete(key)
      else next.set(key, value)
    }
    setSearchParams(next, { replace: true })
  }

  // Gõ xong (debounce) mới đẩy lên URL, đồng thời reset về trang đầu.
  useEffect(() => {
    if (debouncedInput === keyword) return
    updateParams({ q: debouncedInput, page: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedInput])

  useEffect(() => {
    if (debouncedAuthor === author) return
    updateParams({ author: debouncedAuthor, page: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedAuthor])

  // URL đổi từ bên ngoài (click tên tác giả trên card) → đồng bộ lại ô input.
  useEffect(() => {
    setInput(keyword)
  }, [keyword])
  useEffect(() => {
    setAuthorInput(author)
  }, [author])

  const { data, loading, error, refetch } = usePoems({ keyword, author, genreId, page })

  const poems = data?.content ?? []
  const totalPages = Math.ceil((data?.amount ?? 0) / POEM_PAGE_SIZE)
  const hasFilter = keyword !== '' || author !== '' || genreId !== null

  const clearFilters = () => {
    setInput('')
    setAuthorInput('')
    updateParams({ q: null, author: null, genre: null, page: null })
  }

  return (
    <div className="page">
      <header className="poems-header">
        <h1>Bài viết</h1>
        {data && !loading && (
          <span className="poems-count">{data.amount.toLocaleString('vi-VN')} bài</span>
        )}
      </header>

      <div className="filters-row">
        <div className="search-box">
          <IconSearch />
          <input
            className="input search-box__input"
            placeholder="Tìm theo tiêu đề…"
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          {input && (
            <button className="search-box__clear" aria-label="Xóa tìm kiếm" onClick={() => setInput('')}>
              ✕
            </button>
          )}
        </div>
        <div className="search-box">
          <IconSearch />
          <input
            className="input search-box__input"
            placeholder="Lọc theo tác giả…"
            value={authorInput}
            onChange={(event) => setAuthorInput(event.target.value)}
          />
          {authorInput && (
            <button
              className="search-box__clear"
              aria-label="Xóa lọc tác giả"
              onClick={() => setAuthorInput('')}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <GenreFilter
        value={genreId}
        onChange={(nextGenreId) =>
          updateParams({ genre: nextGenreId === null ? null : String(nextGenreId), page: null })
        }
      />

      {error && (
        <div className="page page--center">
          <p className="text-error">{error}</p>
          <Button onClick={() => void refetch()}>Thử lại</Button>
        </div>
      )}

      {!error && loading && (
        <div className="card-grid">
          {Array.from({ length: POEM_PAGE_SIZE }, (_, i) => (
            <PoemCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!error && !loading && poems.length === 0 && (
        <div className="empty-state">
          <span className="empty-state__icon">📭</span>
          <p>Không tìm thấy bài viết nào{hasFilter ? ' khớp bộ lọc' : ''}.</p>
          {hasFilter && (
            <Button variant="secondary" onClick={clearFilters}>
              Xóa bộ lọc
            </Button>
          )}
        </div>
      )}

      {!error && !loading && poems.length > 0 && (
        <>
          <div className="card-grid">
            {poems.map((poem) => (
              <PoemCard key={poem.id} poem={poem} />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={(nextPage) => updateParams({ page: nextPage > 0 ? String(nextPage) : null })}
          />
        </>
      )}
    </div>
  )
}
