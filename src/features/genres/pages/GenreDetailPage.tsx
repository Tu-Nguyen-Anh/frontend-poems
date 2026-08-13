import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { genreService } from '@/services/genre.service'
import { poemService } from '@/services/poem.service'
import { useDebounce } from '@/hooks/useDebounce'
import type { GenreResponse, PoemResponse } from '@/types'
import { PATHS, toPoemSlug } from '@/routes/paths'
import { Skeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/ui/Pagination'
import { IconSearch } from '@/components/ui/icons'
import { poemDisplayTitle, poemAuthorName } from '@/features/poems/display'
import { Seo } from '@/components/common/Seo'

const PAGE_SIZE = 12

export default function GenreDetailPage() {
  const { id } = useParams<{ id: string }>()
  const genreId = Number(id)

  const [genre, setGenre] = useState<GenreResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const [poems, setPoems] = useState<PoemResponse[]>([])
  const [totalPoems, setTotalPoems] = useState(0)
  const [page, setPage] = useState(0)
  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebounce(keyword, 300)
  const [poemsLoading, setPoemsLoading] = useState(true)

  useEffect(() => {
    if (!genreId) return
    setLoading(true)
    genreService
      .getGenreById(genreId)
      .then(setGenre)
      .catch((err) => console.error('Lỗi tải thể loại:', err))
      .finally(() => setLoading(false))
  }, [genreId])

  // Danh sách bài của thể loại: phân trang + tìm kiếm.
  useEffect(() => {
    if (!genreId) return
    setPoemsLoading(true)
    poemService
      .browsePoems({ genreId, keyword: debouncedKeyword || undefined, page, size: PAGE_SIZE })
      .then((res) => {
        setPoems(res.content || [])
        setTotalPoems(res.amount || 0)
      })
      .catch((err) => {
        console.error('Lỗi tải bài thơ của thể loại:', err)
        setPoems([])
      })
      .finally(() => setPoemsLoading(false))
  }, [genreId, debouncedKeyword, page])

  const totalPages = Math.ceil(totalPoems / PAGE_SIZE) || 1

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 space-y-6">
        <Skeleton className="h-10 w-2/3 rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
  }

  if (!genre) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100 mb-2">
          Không tìm thấy thể loại
        </h2>
        <Link to={PATHS.GENRES} className="text-amber-600 hover:underline text-sm font-semibold">
          ← Quay lại danh sách thể loại
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      <Seo
        title={`Thơ ${genre.name}`}
        description={`Tuyển tập các bài thơ thể ${genre.name} — đọc và tra cứu theo thể loại.`}
        path={`/genres/${genre.id}`}
      />
      <Link
        to={PATHS.GENRES}
        className="text-sm text-slate-500 hover:text-amber-700 font-medium flex items-center gap-1"
      >
        ← Tất cả thể loại
      </Link>

      <div className="p-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 font-bold uppercase tracking-wider">
          Thể loại thơ
        </span>
        <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-amber-100 mt-2">
          {genre.name}
        </h1>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-amber-100">
            Bài thơ thuộc thể loại "{genre.name}" ({totalPoems.toLocaleString('vi-VN')})
          </h2>
          <div className="relative w-full sm:w-72">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <IconSearch size={16} />
            </span>
            <input
              type="text"
              placeholder="Tìm trong thể loại này…"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value)
                setPage(0)
              }}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>
        </div>

        {poemsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : poems.length === 0 ? (
          <p className="text-slate-400 text-sm italic py-4">
            {debouncedKeyword ? 'Không tìm thấy bài thơ khớp từ khoá.' : 'Chưa có bài thơ nào thuộc thể loại này.'}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {poems.map((poem) => (
                <Link
                  key={poem.id}
                  to={toPoemSlug(poem)}
                  className="p-6 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700/60 transition-colors"
                >
                  <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-amber-100 mb-1">
                    {poemDisplayTitle(poem)}
                  </h3>
                  <p className="text-xs text-amber-700 font-semibold mb-3">
                    {poemAuthorName(poem)}
                  </p>
                  <p className="text-sm font-serif italic text-slate-600 dark:text-slate-300 line-clamp-3 whitespace-pre-line bg-amber-50/50 dark:bg-slate-900/40 p-3 rounded-xl">
                    {poem.content}
                  </p>
                </Link>
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={setPage}
              totalItems={totalPoems}
              itemLabel="bài thơ"
            />
          </>
        )}
      </div>
    </div>
  )
}
