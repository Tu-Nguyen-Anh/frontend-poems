import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { storyService } from '@/services/story.service'
import { StoryCard } from '@/features/stories/components/StoryCard'
import { FilterSelect, type FilterOption } from '@/features/poems/components/FilterSelect'
import { AuthorFilter } from '@/features/poems/components/AuthorFilter'
import { authorService } from '@/services/author.service'
import type { Ref } from '@/features/browse/browseContext'
import { Pagination } from '@/components/ui/Pagination'
import { IconSearch, IconList, IconGrid } from '@/components/ui/icons'
import { formatNumber } from '@/utils/format'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { toStorySlug } from '@/routes/paths'
import type { StoryResponse, StoryCollection } from '@/types'

const PAGE_SIZE = 12

export default function StoriesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const keyword = searchParams.get('keyword') || ''
  const collection = searchParams.get('collection') || ''
  const authorIdParam = parseInt(searchParams.get('authorId') || '', 10)
  const authorId = Number.isFinite(authorIdParam) && authorIdParam > 0 ? authorIdParam : undefined
  const authorLabel = searchParams.get('authorLabel') || ''
  const page = Math.max(parseInt(searchParams.get('page') || '0', 10) || 0, 0)
  const selectedAuthor: Ref | null = authorId ? { id: authorId, label: authorLabel || `Tác giả #${authorId}` } : null

  const [search, setSearch] = useState(keyword)
  const [collections, setCollections] = useState<StoryCollection[]>([])
  const [totalAuthors, setTotalAuthors] = useState<number | null>(null)
  const [stories, setStories] = useState<StoryResponse[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useLocalStorage<'list' | 'grid'>('stories_view', 'grid')

  // Đồng bộ ô search khi URL đổi từ bên ngoài (vd bấm back).
  useEffect(() => setSearch(keyword), [keyword])

  // Thống kê tổng (không đổi theo bộ lọc): thể loại + tổng bài (từ collections), số tác giả văn.
  useEffect(() => {
    storyService.getCollections().then(setCollections).catch(() => setCollections([]))
    authorService
      .getAuthors({ type: 'story', page: 0, size: 1 })
      .then((res) => setTotalAuthors(res.amount ?? null))
      .catch(() => setTotalAuthors(null))
  }, [])

  const totalStories = useMemo(() => collections.reduce((s, c) => s + (c.count || 0), 0), [collections])
  const totalCollections = collections.length

  useEffect(() => {
    let alive = true
    setLoading(true)
    storyService
      .getStories({ keyword, collection, authorId, page, size: PAGE_SIZE })
      .then((res) => {
        if (!alive) return
        setStories(res.content || [])
        setTotal(res.amount || 0)
      })
      .catch(() => {
        if (!alive) return
        setStories([])
        setTotal(0)
      })
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [keyword, collection, authorId, page])

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1)

  const collectionOptions: FilterOption[] = useMemo(
    () => collections.map((c) => ({ value: c.collection, label: `${c.collection} (${c.count.toLocaleString('vi-VN')})` })),
    [collections],
  )

  const patchParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams)
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k)
      else next.set(k, v)
    }
    setSearchParams(next)
  }

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    patchParams({ keyword: search.trim() || null, page: null })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-amber-100">Truyện ngắn</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Kho văn xuôi: truyện ngắn, tùy bút, kiếm hiệp, tiểu thuyết…
        </p>

        {totalStories > 0 && (
          <dl className="flex flex-nowrap gap-x-8 sm:gap-x-12 pt-4">
            <div>
              <dt className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Bài văn</dt>
              <dd className="font-serif text-xl sm:text-3xl font-bold text-amber-700 dark:text-amber-400">{formatNumber(totalStories)}</dd>
            </div>
            {totalAuthors != null && totalAuthors > 0 && (
              <div>
                <dt className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Tác giả</dt>
                <dd className="font-serif text-xl sm:text-3xl font-bold text-amber-700 dark:text-amber-400">{formatNumber(totalAuthors)}</dd>
              </div>
            )}
            {totalCollections > 0 && (
              <div>
                <dt className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Thể loại</dt>
                <dd className="font-serif text-xl sm:text-3xl font-bold text-amber-700 dark:text-amber-400">{formatNumber(totalCollections)}</dd>
              </div>
            )}
          </dl>
        )}
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <form onSubmit={submitSearch} className="lg:col-span-2 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <IconSearch size={16} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên truyện…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-800 dark:text-slate-100 placeholder-slate-400"
          />
        </form>
        <FilterSelect
          value={collection}
          placeholder="Mọi thể loại"
          options={collectionOptions}
          onSelect={(opt) => patchParams({ collection: opt?.value ?? null, page: null })}
        />
        <AuthorFilter
          type="story"
          value={selectedAuthor}
          onChange={(a) =>
            patchParams({ authorId: a ? String(a.id) : null, authorLabel: a ? a.label : null, page: null })
          }
        />
      </div>

      {/* Số kết quả + nút chuyển dạng xem */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {total.toLocaleString('vi-VN')} tác phẩm
          {totalPages > 1 && <span className="text-slate-400"> · Trang {page + 1}/{totalPages.toLocaleString('vi-VN')}</span>}
        </p>
        <div className="flex items-center gap-0.5 p-0.5 rounded-md border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setView('list')}
            aria-label="Dạng danh sách"
            title="Dạng danh sách"
            className={`p-1.5 rounded transition-colors ${
              view === 'list' ? 'bg-amber-700 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <IconList size={16} />
          </button>
          <button
            onClick={() => setView('grid')}
            aria-label="Dạng lưới"
            title="Dạng lưới"
            className={`p-1.5 rounded transition-colors ${
              view === 'grid' ? 'bg-amber-700 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <IconGrid size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-slate-400 py-16">Đang tải…</p>
      ) : stories.length === 0 ? (
        <p className="text-center text-slate-400 py-16">Không tìm thấy tác phẩm nào.</p>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {stories.map((s) => (
            <StoryCard key={s.id} story={s} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {stories.map((s) => (
            <Link
              key={s.id}
              to={toStorySlug(s)}
              className="group flex items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700/60 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300">
                    {s.collection || 'Văn xuôi'}
                  </span>
                  {s.chapter_count && s.chapter_count > 1 && (
                    <span className="text-xs text-slate-400">{s.chapter_count} chương</span>
                  )}
                  {s.year && <span className="text-xs text-slate-400 font-mono">{s.year}</span>}
                </div>
                <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-amber-100 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors truncate">
                  {s.title}
                </h3>
                {s.author && <p className="text-xs font-medium text-amber-700/80 dark:text-amber-400/80 truncate">{s.author}</p>}
              </div>
              <span className="flex-shrink-0 text-slate-300 dark:text-slate-600 group-hover:text-amber-600 transition-colors">→</span>
            </Link>
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={total}
        itemLabel="tác phẩm"
        onChange={(p) => patchParams({ page: p === 0 ? null : String(p) })}
      />
    </div>
  )
}
