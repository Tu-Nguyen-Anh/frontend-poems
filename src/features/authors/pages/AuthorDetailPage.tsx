import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { authorService } from '@/services/author.service'
import { poemService } from '@/services/poem.service'
import { useDebounce } from '@/hooks/useDebounce'
import type { AuthorResponse, PoemResponse } from '@/types'
import { PATHS, toPoemSlug } from '@/routes/paths'
import { Skeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/ui/Pagination'
import { IconSearch } from '@/components/ui/icons'
import { poemDisplayTitle } from '@/features/poems/display'
import { Seo } from '@/components/common/Seo'
import { env } from '@/config/env'

const PAGE_SIZE = 12

export default function AuthorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const authorId = Number(id)

  const [author, setAuthor] = useState<AuthorResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [avatarError, setAvatarError] = useState(false)

  const [poems, setPoems] = useState<PoemResponse[]>([])
  const [totalPoems, setTotalPoems] = useState(0)
  const [page, setPage] = useState(0)
  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebounce(keyword, 300)
  const [poemsLoading, setPoemsLoading] = useState(true)

  // Tác giả tải riêng (không phụ thuộc danh sách bài -> tránh vỡ trang nếu bài lỗi).
  useEffect(() => {
    if (!authorId) return
    setLoading(true)
    authorService
      .getAuthorById(authorId)
      .then(setAuthor)
      .catch((err) => console.error('Lỗi tải thông tin tác giả:', err))
      .finally(() => setLoading(false))
  }, [authorId])

  // Danh sách bài: phân trang + tìm kiếm trong thơ của tác giả.
  useEffect(() => {
    if (!authorId) return
    setPoemsLoading(true)
    poemService
      .browsePoems({ authorId, keyword: debouncedKeyword || undefined, page, size: PAGE_SIZE })
      .then((res) => {
        setPoems(res.content || [])
        setTotalPoems(res.amount || 0)
      })
      .catch((err) => {
        console.error('Lỗi tải bài thơ của tác giả:', err)
        setPoems([])
      })
      .finally(() => setPoemsLoading(false))
  }, [authorId, debouncedKeyword, page])

  const totalPages = Math.ceil(totalPoems / PAGE_SIZE) || 1

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

  // Ưu tiên ảnh tự crawl trên RustFS (avatar_local); fallback URL gốc thivien (avatar_url).
  const avatarLocal = author.avatar_local ?? author.avatarLocal
  const avatarUrl = avatarLocal
    ? `${env.AVATAR_BASE_URL}/${avatarLocal}`
    : (author.avatar_url ?? author.avatarUrl)
  const bio = author.bio?.trim()
  const country = author.country

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
        {avatarUrl && !avatarError ? (
          <img
            src={avatarUrl}
            alt={`Chân dung ${author.name}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setAvatarError(true)}
            className="w-28 h-28 rounded-xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0 bg-slate-100 dark:bg-slate-900"
          />
        ) : (
          <div className="w-28 h-28 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 flex items-center justify-center font-serif font-bold text-4xl flex-shrink-0">
            {author.name.charAt(0)}
          </div>
        )}
        <div className="space-y-3 text-center md:text-left flex-1 min-w-0">
          <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-amber-100">
            {author.name}
          </h1>
          <div className="flex flex-wrap gap-4 text-xs font-semibold text-amber-800 dark:text-amber-300">
            {author.birthYear && <span>Năm sinh: {author.birthYear}</span>}
            {country && <span>Quốc gia: {country}</span>}
            {author.hometown && <span>Quê quán: {author.hometown}</span>}
          </div>
          {bio ? (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {bio}
              </p>
            </div>
          ) : author.achievement ? (
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-700">
              <strong>Thành tựu &amp; Tiểu sử:</strong> {author.achievement}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-amber-100">
            Bài thơ của tác giả ({totalPoems.toLocaleString('vi-VN')})
          </h2>
          <div className="relative w-full sm:w-72">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <IconSearch size={16} />
            </span>
            <input
              type="text"
              placeholder="Tìm trong thơ của tác giả…"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value)
                setPage(0)
              }}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>
        </div>

        {poemsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : poems.length === 0 ? (
          <p className="text-slate-400 text-sm italic py-4">
            {debouncedKeyword
              ? 'Không tìm thấy bài thơ khớp từ khoá.'
              : 'Chưa có bài thơ nào của tác giả này trong hệ thống.'}
          </p>
        ) : (
          <>
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
            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={setPage}
              totalItems={totalPoems}
              itemLabel="bài thơ"
            />
          </>
        )}
      </div>
    </div>
  )
}
