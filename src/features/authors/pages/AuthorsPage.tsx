import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { authorService } from '@/services/author.service'
import type { AuthorResponse } from '@/types'
import { toAuthorDetail } from '@/routes/paths'
import { Skeleton } from '@/components/ui/Skeleton'
import { IconSearch } from '@/components/ui/icons'

export default function AuthorsPage() {
  const [authors, setAuthors] = useState<AuthorResponse[]>([])
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAuthors() {
      setLoading(true)
      try {
        const res = await authorService.getAuthors({ keyword: keyword || undefined, isAll: true })
        setAuthors(res.content || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAuthors()
  }, [keyword])

  return (
    <div className="space-y-8 py-4">
      <div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-amber-100 mb-2">
          Danh sách tác giả
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Những gương mặt thi sĩ trong kho tàng thơ ca
        </p>
      </div>

      <div className="max-w-md relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <IconSearch size={16} />
        </span>
        <input
          type="text"
          placeholder="Tìm tên tác giả hoặc quê quán…"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {authors.map((author) => (
            <Link
              key={author.id}
              to={toAuthorDetail(author.id)}
              className="p-6 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700/60 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 flex items-center justify-center font-serif font-bold text-2xl">
                  {author.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-amber-100">
                    {author.name}
                  </h3>
                  {author.birthYear && (
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                      Năm sinh: {author.birthYear}
                    </p>
                  )}
                  {author.hometown && (
                    <p className="text-xs text-slate-400 mt-1">Quê quán: {author.hometown}</p>
                  )}
                </div>
              </div>
              {author.achievement && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 line-clamp-2 italic border-t border-slate-100 dark:border-slate-700/60 pt-3">
                  "{author.achievement}"
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
