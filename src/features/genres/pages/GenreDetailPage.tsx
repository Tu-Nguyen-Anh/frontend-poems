import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { genreService } from '@/services/genre.service'
import type { GenreResponse, PoemResponse } from '@/types'
import { PATHS, toPoemDetail } from '@/routes/paths'
import { Skeleton } from '@/components/ui/Skeleton'
import { poemDisplayTitle, poemAuthorName } from '@/features/poems/display'

export default function GenreDetailPage() {
  const { id } = useParams<{ id: string }>()
  const genreId = Number(id)

  const [genre, setGenre] = useState<GenreResponse | null>(null)
  const [poems, setPoems] = useState<PoemResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (!genreId) return
      setLoading(true)
      try {
        const [genreData, poemData] = await Promise.all([
          genreService.getGenreById(genreId),
          genreService.getPoemsByGenre(genreId),
        ])
        setGenre(genreData)
        setPoems(Array.isArray(poemData) ? poemData : [])
      } catch (err) {
        console.error('Lỗi tải thể loại:', err)
        setPoems([])
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [genreId])

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
        <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-amber-100">
          Bài thơ thuộc thể loại "{genre.name}" ({poems.length})
        </h2>

        {poems.length === 0 ? (
          <p className="text-slate-400 text-sm italic py-4">Chưa có bài thơ nào thuộc thể loại này.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {poems.map((poem) => (
              <Link
                key={poem.id}
                to={toPoemDetail(poem.id)}
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
        )}
      </div>
    </div>
  )
}
