import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { poemService } from '@/services/poem.service'
import { genreService } from '@/services/genre.service'
import { useDebounce } from '@/hooks/useDebounce'
import type { PoemResponse, GenreResponse } from '@/types'
import { toPoemDetail } from '@/routes/paths'
import { Skeleton } from '@/components/ui/Skeleton'

export default function PoemsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialKeyword = searchParams.get('keyword') || ''

  const [keyword, setKeyword] = useState(initialKeyword)
  const debouncedKeyword = useDebounce(keyword, 400)
  const [page, setPage] = useState(0)
  const size = 9

  const [poems, setPoems] = useState<PoemResponse[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [genres, setGenres] = useState<GenreResponse[]>([])
  const [selectedGenre, setSelectedGenre] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchGenres() {
      try {
        const res = await genreService.getGenres({ isAll: true })
        setGenres(res.content || [])
      } catch (err) {
        console.error(err)
      }
    }
    fetchGenres()
  }, [])

  useEffect(() => {
    async function fetchPoems() {
      setLoading(true)
      try {
        const res = await poemService.getPoems({
          keyword: debouncedKeyword || undefined,
          page,
          size,
        })
        setPoems(res.content || [])
        setTotalAmount(res.amount || 0)
      } catch (err) {
        console.error('Lỗi tải danh sách bài thơ', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPoems()
  }, [debouncedKeyword, page])

  const totalPages = Math.ceil(totalAmount / size) || 1

  const filteredPoems = selectedGenre
    ? poems.filter((p) => p.genreName === selectedGenre)
    : poems

  return (
    <div className="space-y-8 py-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-amber-100 mb-2">
          📜 Kho Tàng Bài Thơ
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Khám phá danh tác thi đàn Việt Nam và thế giới
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Tìm theo tên bài thơ hoặc nội dung..."
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setPage(0)
            }}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
        </div>

        {/* Genre Selector */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedGenre('')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedGenre === ''
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Tất cả thể loại
          </button>
          {genres.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedGenre(g.name === selectedGenre ? '' : g.name)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedGenre === g.name
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      {/* Poems Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : filteredPoems.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <div className="text-4xl mb-3">🍃</div>
          <h3 className="text-lg font-serif font-bold text-slate-700 dark:text-slate-300 mb-1">
            Không tìm thấy bài thơ nào
          </h3>
          <p className="text-slate-400 text-xs">Thử tìm kiếm với từ khóa khác hoặc bỏ lọc thể loại</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredPoems.map((poem) => (
            <Link
              key={poem.id}
              to={toPoemDetail(poem.id)}
              className="group p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300">
                    {poem.genreName || 'Thơ'}
                  </span>
                  {poem.year && (
                    <span className="text-xs text-slate-400 font-mono">{poem.year}</span>
                  )}
                </div>
                <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-amber-100 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition line-clamp-1 mb-1">
                  {poem.name}
                </h3>
                <p className="text-xs font-medium text-amber-700/80 dark:text-amber-400/80 mb-3">
                  ✍️ {poem.authorName || 'Vô danh'}
                </p>
                <div className="text-slate-600 dark:text-slate-300 text-sm font-serif italic line-clamp-4 leading-relaxed whitespace-pre-line bg-amber-50/40 dark:bg-slate-900/40 p-3 rounded-xl border border-amber-900/5">
                  {poem.content}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
                <span>Khám phá bài thơ</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-6">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-amber-100 transition"
          >
            ← Trang trước
          </button>
          <span className="text-xs font-medium text-slate-500 px-3">
            Trang {page + 1} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-amber-100 transition"
          >
            Trang sau →
          </button>
        </div>
      )}
    </div>
  )
}
