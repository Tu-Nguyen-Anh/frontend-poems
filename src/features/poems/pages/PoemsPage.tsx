import { useState } from 'react'
import { Button, Input, Pagination, Spinner } from '@/components/ui'
import { useDebounce } from '@/hooks'
import { GenreFilter } from '../components/GenreFilter'
import { PoemCard } from '../components/PoemCard'
import { POEM_PAGE_SIZE } from '../constants'
import { usePoems } from '../hooks/usePoems'

export default function PoemsPage() {
  const [keyword, setKeyword] = useState('')
  const [genreId, setGenreId] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const debouncedKeyword = useDebounce(keyword)

  const { data, loading, error, refetch } = usePoems({
    keyword: debouncedKeyword,
    genreId,
    page,
  })

  const handleGenreChange = (nextGenreId: number | null) => {
    setGenreId(nextGenreId)
    setPage(0)
  }

  const handleKeywordChange = (nextKeyword: string) => {
    setKeyword(nextKeyword)
    setPage(0)
  }

  const poems = data?.content ?? []
  const totalPages = Math.ceil((data?.amount ?? 0) / POEM_PAGE_SIZE)

  return (
    <div className="page">
      <h1>Bài viết theo chủ đề</h1>
      <Input
        placeholder="Tìm theo tiêu đề…"
        value={keyword}
        onChange={(event) => handleKeywordChange(event.target.value)}
      />
      <GenreFilter value={genreId} onChange={handleGenreChange} />

      {loading && <Spinner />}

      {error && (
        <div className="page page--center">
          <p className="text-error">{error}</p>
          <Button onClick={() => void refetch()}>Thử lại</Button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="card-grid">
            {poems.map((poem) => (
              <PoemCard key={poem.id} poem={poem} />
            ))}
          </div>
          {poems.length === 0 && <p>Không có bài viết nào.</p>}
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  )
}
