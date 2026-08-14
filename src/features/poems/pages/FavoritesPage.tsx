import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { favoriteService } from '@/services/favorite.service'
import type { PoemResponse } from '@/types'
import { PoemCard } from '@/features/poems/components/PoemCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { PATHS } from '@/routes/paths'
import { Seo } from '@/components/common/Seo'

export default function FavoritesPage() {
  const [poems, setPoems] = useState<PoemResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    favoriteService
      .myFavorites({ page: 0, size: 60 })
      .then((res) => alive && setPoems(res.content || []))
      .catch(() => {})
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="max-w-5xl mx-auto pt-1 pb-10 space-y-6">
      <Seo title="Bài thơ yêu thích" path={PATHS.FAVORITES} noindex />

      <header className="space-y-1">
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-slate-900 dark:text-amber-100">
          Bài thơ yêu thích
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Những bài thơ bạn đã lưu để đọc lại
        </p>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : poems.length === 0 ? (
        <div className="text-center py-16 text-slate-500 dark:text-slate-400">
          <p className="text-4xl mb-3">♡</p>
          <p>Bạn chưa lưu bài thơ nào.</p>
          <Link
            to={PATHS.POEMS}
            className="inline-block mt-4 px-4 py-2 rounded-md bg-amber-700 hover:bg-amber-800 text-white text-sm font-medium transition-colors"
          >
            Khám phá kho thơ
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {poems.map((poem) => (
            <PoemCard key={poem.id} poem={poem} />
          ))}
        </div>
      )}
    </div>
  )
}
