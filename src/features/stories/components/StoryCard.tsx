import { Link, useLocation } from 'react-router-dom'
import { toStorySlug, toAuthorDetail } from '@/routes/paths'
import type { StoryResponse } from '@/types'

function formatCount(n?: number): string | null {
  if (!n || n <= 0) return null
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return String(n)
}

export function StoryCard({ story }: { story: StoryResponse }) {
  const location = useLocation()
  const detailPath = toStorySlug(story)
  const linkState = { listSearch: location.search }

  const collection = story.collection || 'Văn xuôi'
  const words = formatCount(story.word_count)
  const chapters = story.chapter_count && story.chapter_count > 1 ? story.chapter_count : null

  return (
    <article className="p-6 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700/60 transition-colors flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
            {collection}
          </span>
          {story.year && <span className="text-xs text-slate-400 font-mono">{story.year}</span>}
        </div>
        <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-amber-100 mb-1 line-clamp-2">
          <Link to={detailPath} state={linkState} className="hover:text-amber-700 dark:hover:text-amber-300 transition-colors">
            {story.title}
          </Link>
        </h3>
        {story.author && (
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-3">
            {story.author_id ? (
              <Link to={toAuthorDetail(story.author_id)} className="hover:underline">
                {story.author}
              </Link>
            ) : (
              story.author
            )}
          </p>
        )}
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs text-slate-400">
        <span className="flex gap-3">
          {chapters && <span>{chapters} chương</span>}
          {words && <span>{words} từ</span>}
        </span>
        <Link to={detailPath} state={linkState} className="text-amber-700 dark:text-amber-400 font-medium hover:underline">
          Đọc truyện
        </Link>
      </div>
    </article>
  )
}
