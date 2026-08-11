import { Link, useLocation } from 'react-router-dom'
import { PATHS, toPoemDetail } from '@/routes/paths'
import type { PoemResponse } from '@/types'
import { poemDisplayTitle, poemAuthorName } from '@/features/poems/display'

export function PoemCard({ poem }: { poem: PoemResponse }) {
  const location = useLocation()
  const detailPath = toPoemDetail(poem.id)
  const linkState = { listSearch: location.search }

  const poemTitle = poemDisplayTitle(poem)
  const authorName = poemAuthorName(poem)
  const genreName = poem.genreName || (poem as any).genre_name || 'Thơ'

  return (
    <article className="p-6 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700/60 transition-colors flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
            {genreName}
          </span>
          {poem.year && <span className="text-xs text-slate-400 font-mono">{poem.year}</span>}
        </div>
        <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-amber-100 mb-1">
          <Link to={detailPath} state={linkState} className="hover:text-amber-700 dark:hover:text-amber-300 transition-colors">
            {poemTitle}
          </Link>
        </h3>
        <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-3">
          <Link to={`${PATHS.POEMS}?author=${encodeURIComponent(authorName)}`}>
            {authorName}
          </Link>
        </p>
        <p className="text-slate-600 dark:text-slate-300 text-sm font-serif italic line-clamp-3 leading-relaxed whitespace-pre-line bg-amber-50/40 dark:bg-slate-900/40 p-3 rounded-xl">
          {poem.content}
        </p>
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs text-slate-400">
        <Link to={detailPath} state={linkState} className="text-amber-700 dark:text-amber-400 font-medium hover:underline">
          Đọc tiếp
        </Link>
      </div>
    </article>
  )
}
