import { Link } from 'react-router-dom'
import type { PoemResponse } from '@/types'
import { PATHS, toPoemDetail } from '@/routes/paths'
import { Skeleton } from '@/components/ui/Skeleton'

interface LatestPoemsSectionProps {
  poems: PoemResponse[]
  loading: boolean
}

export function LatestPoemsSection({ poems, loading }: LatestPoemsSectionProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 dark:text-amber-100">
            📜 Bài Thơ Mới Nhất
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Vừa được thêm vào kho tàng thi đàn</p>
        </div>
        <Link
          to={PATHS.POEMS}
          className="text-amber-700 dark:text-amber-400 font-medium text-sm hover:underline flex items-center gap-1"
        >
          Xem tất cả →
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {poems.map((poem) => (
            <Link
              key={poem.id}
              to={toPoemDetail(poem.id)}
              className="group p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between"
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
                <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-amber-100 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition line-clamp-1 mb-2">
                  {poem.name}
                </h3>
                <p className="text-xs font-medium text-amber-700/80 dark:text-amber-400/80 mb-3">
                  ✍️ {poem.authorName || 'Vô danh'}
                </p>
                <p className="text-slate-600 dark:text-slate-300 text-sm font-serif italic line-clamp-3 leading-relaxed whitespace-pre-line bg-amber-50/50 dark:bg-slate-900/40 p-3 rounded-xl border border-amber-900/5">
                  {poem.content}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
                <span>Xem chi tiết</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
