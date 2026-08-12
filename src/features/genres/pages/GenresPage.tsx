import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { genreService } from '@/services/genre.service'
import type { GenreResponse } from '@/types'
import { toGenreDetail } from '@/routes/paths'
import { Skeleton } from '@/components/ui/Skeleton'
import { Seo } from '@/components/common/Seo'

export default function GenresPage() {
  const [genres, setGenres] = useState<GenreResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchGenres() {
      setLoading(true)
      try {
        const res = await genreService.getGenres({ isAll: true })
        setGenres(res.content || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchGenres()
  }, [])

  return (
    <div className="space-y-8 py-4">
      <Seo
        title="Thể loại thơ ca"
        description="Các thể thơ Việt Nam và thế giới: lục bát, thất ngôn bát cú, ngũ ngôn, thơ mới, ca trù… kèm tuyển tập bài thơ từng thể loại."
        path="/genres"
      />
      <div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-amber-100 mb-2">
          Thể loại thơ ca
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Các thể thơ trong thi đàn Việt Nam
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {genres.map((genre) => (
            <Link
              key={genre.id}
              to={toGenreDetail(genre.id)}
              className="p-6 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700/60 transition-colors"
            >
              <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-amber-100">
                {genre.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Xem các bài thơ thuộc thể loại này</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
