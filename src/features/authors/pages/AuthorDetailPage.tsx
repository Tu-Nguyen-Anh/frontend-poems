import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { authorService } from '@/services/author.service'
import type { AuthorResponse, PoemResponse } from '@/types'
import { PATHS, toPoemSlug } from '@/routes/paths'
import { Skeleton } from '@/components/ui/Skeleton'
import { poemDisplayTitle } from '@/features/poems/display'
import { Seo } from '@/components/common/Seo'

export default function AuthorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const authorId = Number(id)

  const [author, setAuthor] = useState<AuthorResponse | null>(null)
  const [poems, setPoems] = useState<PoemResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (!authorId) return
      setLoading(true)
      try {
        const [authorData, poemData] = await Promise.all([
          authorService.getAuthorById(authorId),
          authorService.getPoemsByAuthor(authorId),
        ])
        setAuthor(authorData)
        setPoems(Array.isArray(poemData) ? poemData : [])
      } catch (err) {
        console.error('Lỗi tải thông tin tác giả:', err)
        setPoems([])
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [authorId])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 space-y-6">
        <Skeleton className="h-10 w-2/3 rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
  }

  if (!author) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100 mb-2">
          Không tìm thấy tác giả
        </h2>
        <Link to={PATHS.AUTHORS} className="text-amber-600 hover:underline text-sm font-semibold">
          ← Quay lại danh sách tác giả
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      <Seo
        title={`Thơ ${author.name}`}
        description={`Tuyển tập thơ của ${author.name}${author.hometown ? ` (${author.hometown})` : ''} — đọc toàn bộ tác phẩm, tiểu sử và thành tựu.`}
        path={`/authors/${author.id}`}
      />
      <Link
        to={PATHS.AUTHORS}
        className="text-sm text-slate-500 hover:text-amber-700 font-medium flex items-center gap-1"
      >
        ← Danh sách tác giả
      </Link>

      <div className="p-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-6 items-center md:items-start">
        <div className="w-24 h-24 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 flex items-center justify-center font-serif font-bold text-4xl flex-shrink-0">
          {author.name.charAt(0)}
        </div>
        <div className="space-y-3 text-center md:text-left">
          <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-amber-100">
            {author.name}
          </h1>
          <div className="flex flex-wrap gap-4 text-xs font-semibold text-amber-800 dark:text-amber-300">
            {author.birthYear && <span>Năm sinh: {author.birthYear}</span>}
            {author.hometown && <span>Quê quán: {author.hometown}</span>}
          </div>
          {author.achievement && (
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-700">
              <strong>Thành tựu & Tiểu sử:</strong> {author.achievement}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-amber-100">
          Bài thơ của tác giả ({poems.length})
        </h2>

        {poems.length === 0 ? (
          <p className="text-slate-400 text-sm italic py-4">Chưa có bài thơ nào của tác giả này trong hệ thống.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {poems.map((poem) => (
              <Link
                key={poem.id}
                to={toPoemSlug(poem)}
                className="p-6 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700/60 transition-colors"
              >
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-semibold">
                  {poem.genreName || 'Thơ'}
                </span>
                <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-amber-100 mt-2 mb-1">
                  {poemDisplayTitle(poem)}
                </h3>
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
