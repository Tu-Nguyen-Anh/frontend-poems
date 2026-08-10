import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { genreService } from '@/services/genre.service'
import type { GenreResponse } from '@/types'
import { toGenreDetail } from '@/routes/paths'
import { Skeleton } from '@/components/ui/Skeleton'

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
      <div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-amber-100 mb-2">
          🏷️ Thể Loại Thơ Ca
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Phân loại các thể thơ phong phú trong thi đàn Việt Nam
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {genres.map((genre) => (
            <Link
              key={genre.id}
              to={toGenreDetail(genre.id)}
              className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-xl hover:border-amber-500 transition transform hover:-translate-y-1 group"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 flex items-center justify-center font-bold text-xl mb-4 group-hover:scale-110 transition">
                🏷️
              </div>
              <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-amber-100 group-hover:text-amber-600 transition">
                {genre.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Khám phá các bài thơ thuộc thể loại này →</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
