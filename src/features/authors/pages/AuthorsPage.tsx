import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { authorService } from '@/services/author.service'
import type { AuthorResponse } from '@/types'
import { toAuthorDetail } from '@/routes/paths'
import { Skeleton } from '@/components/ui/Skeleton'

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
          ✍️ Danh Sách Tác Giả
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Những gương mặt thi sĩ tiêu biểu gầy dựng kho tàng thơ ca
        </p>
      </div>

      <div className="max-w-md relative">
        <input
          type="text"
          placeholder="Tìm tên tác giả hoặc quê quán..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 shadow-sm"
        />
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {authors.map((author) => (
            <Link
              key={author.id}
              to={toAuthorDetail(author.id)}
              className="group p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-700 to-amber-500 text-white flex items-center justify-center font-serif font-bold text-2xl shadow-md group-hover:scale-105 transition">
                  {author.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-amber-100 group-hover:text-amber-600 transition">
                    {author.name}
                  </h3>
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                    {author.birthYear ? `Năm sinh: ${author.birthYear}` : 'Tác giả đại thụ'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Quê quán: {author.hometown || 'Chưa cập nhật'}
                  </p>
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
