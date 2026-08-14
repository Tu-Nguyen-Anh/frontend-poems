import { Link } from 'react-router-dom'
import type { PoemResponse } from '@/types'
import { PATHS, toPoemSlug } from '@/routes/paths'
import { Skeleton } from '@/components/ui/Skeleton'
import { SectionHeader } from './SectionHeader'
import { poemDisplayTitle, poemAuthorName } from '@/features/poems/display'

interface LatestPoemsSectionProps {
  poems: PoemResponse[]
  loading: boolean
}

export function LatestPoemsSection({ poems, loading }: LatestPoemsSectionProps) {
  return (
    <section className="space-y-6">
      <SectionHeader
        title="Bài thơ mới nhất"
        description="Vừa được thêm vào kho thơ"
        linkTo={PATHS.POEMS}
        linkLabel="Xem tất cả"
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {poems.slice(0, 6).map((poem) => (
            <Link
              key={poem.id}
              to={toPoemSlug(poem)}
              className="group p-6 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700/60 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                  {poem.genreName || 'Thơ'}
                </span>
                {poem.year && <span className="text-xs text-slate-400">{poem.year}</span>}
              </div>
              <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-amber-100 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors mb-1">
                {poemDisplayTitle(poem)}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{poemAuthorName(poem)}</p>
              <p className="text-sm font-serif italic text-slate-600 dark:text-slate-300 line-clamp-2 whitespace-pre-line">
                {poem.content}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
