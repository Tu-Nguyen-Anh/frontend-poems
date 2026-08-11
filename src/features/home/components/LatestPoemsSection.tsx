import { Link } from 'react-router-dom'
import type { PoemResponse } from '@/types'
import { PATHS, toPoemDetail } from '@/routes/paths'
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
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {poems.map((poem) => (
            <Link
              key={poem.id}
              to={toPoemDetail(poem.id)}
              className="group flex items-start justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700/60 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                    {poem.genreName || 'Thơ'}
                  </span>
                  {poem.year && <span className="text-xs text-slate-400">{poem.year}</span>}
                </div>
                <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-amber-100 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors truncate">
                  {poemDisplayTitle(poem)}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{poemAuthorName(poem)}</p>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 font-serif italic line-clamp-2 whitespace-pre-line">
                  {poem.content}
                </p>
              </div>
              <span className="flex-shrink-0 self-center text-slate-300 dark:text-slate-600 group-hover:text-amber-600 transition-colors">
                →
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
