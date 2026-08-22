import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PATHS } from '@/routes/paths'
import { IconSearch } from '@/components/ui/icons'
import { formatNumber } from '@/utils/format'
import { useDebounce } from '@/hooks/useDebounce'
import type { LibraryStats } from '@/types'

interface HeroBannerProps {
  totalPoems?: number | null
  totalStories?: number | null
  totalAuthors?: number | null
  storyAuthors?: number | null
  totalGenres?: number | null
  storyCollections?: number | null
  stats?: LibraryStats | null
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
        {label}
      </dt>
      <dd className="font-serif text-lg sm:text-2xl md:text-3xl font-bold text-amber-700 dark:text-amber-400">
        {formatNumber(value)}
      </dd>
    </div>
  )
}

export function HeroBanner({ totalPoems, totalStories, totalAuthors, storyAuthors, totalGenres, storyCollections, stats }: HeroBannerProps) {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const debounced = useDebounce(search, 500)

  // Tự chuyển sang trang kết quả khi ngừng gõ (auto-search), không cần bấm Enter.
  useEffect(() => {
    const kw = debounced.trim()
    if (kw.length >= 2) {
      navigate(`${PATHS.POEMS}?keyword=${encodeURIComponent(kw)}`)
    }
  }, [debounced, navigate])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      navigate(`${PATHS.POEMS}?keyword=${encodeURIComponent(search.trim())}`)
    }
  }

  // Tìm VĂN theo tiêu đề (submit bằng Enter/nút, không auto-nav để khỏi giành với ô thơ).
  const [searchStory, setSearchStory] = useState('')
  const handleSearchStory = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchStory.trim()) {
      navigate(`${PATHS.STORIES}?keyword=${encodeURIComponent(searchStory.trim())}`)
    }
  }

  return (
    <section className="rounded-xl border border-amber-200/70 dark:border-slate-700 bg-amber-50/60 dark:bg-slate-900/60 px-6 py-12 md:px-12 md:py-16">
      <div className="max-w-2xl space-y-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-400">
          Thơ ca Việt Nam
        </p>
        <h1 className="font-serif text-3xl md:text-5xl font-bold leading-tight text-slate-900 dark:text-amber-50">
          Kho tàng thơ ca Việt
        </h1>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed md:text-lg">
          Thơ cổ điển và hiện đại, tra cứu theo tác giả và thể loại, đọc trong chế độ
          đọc cổ điển hoặc hiện đại.
        </p>

        <div className="space-y-5 pt-2">
          {/* Nhóm Thơ: số liệu + ô tìm thơ */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700/80 dark:text-amber-400/80">
              Thơ
            </p>
            {totalPoems != null && totalPoems > 0 && (
              <>
                <dl className="flex flex-nowrap gap-x-8 sm:gap-x-12">
                  <Stat label="Bài thơ" value={totalPoems} />
                  {totalAuthors != null && totalAuthors > 0 && <Stat label="Tác giả" value={totalAuthors} />}
                  {totalGenres != null && totalGenres > 0 && <Stat label="Thể loại" value={totalGenres} />}
                  {stats != null && stats.total_countries > 0 && <Stat label="Quốc gia" value={stats.total_countries} />}
                </dl>
                {stats != null && stats.total_poems > 0 && (
                  <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                    Trong đó{' '}
                    <span className="font-semibold text-amber-700 dark:text-amber-400">{formatNumber(stats.viet_count)}</span> bài tiếng Việt
                    {' · '}
                    <span className="font-semibold text-amber-700 dark:text-amber-400">{formatNumber(stats.han_count)}</span> bài chữ Hán
                    {' · '}
                    <span className="font-semibold text-amber-700 dark:text-amber-400">{formatNumber(stats.foreign_count)}</span> bài nước ngoài
                  </p>
                )}
              </>
            )}
            <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <IconSearch size={18} />
                </span>
                <input
                  type="text"
                  placeholder="Tên bài, tác giả, hoặc một câu thơ…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>
              <button type="submit" className="min-w-[8.5rem] px-6 py-3 border border-transparent bg-amber-700 hover:bg-amber-800 text-white font-medium text-sm rounded-md transition-colors whitespace-nowrap">
                Tìm thơ
              </button>
            </form>
          </div>

          {/* Nhóm Văn xuôi: số liệu + ô tìm theo tiêu đề */}
          <div className="space-y-3 pt-4 border-t border-amber-200/50 dark:border-slate-700/60">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700/80 dark:text-amber-400/80">
              Văn xuôi
            </p>
            {totalStories != null && totalStories > 0 && (
              <dl className="flex flex-nowrap gap-x-8 sm:gap-x-12">
                <Stat label="Bài văn" value={totalStories} />
                {storyAuthors != null && storyAuthors > 0 && <Stat label="Tác giả" value={storyAuthors} />}
                {storyCollections != null && storyCollections > 0 && <Stat label="Thể loại" value={storyCollections} />}
              </dl>
            )}
            <form onSubmit={handleSearchStory} className="flex gap-2 max-w-md">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <IconSearch size={18} />
                </span>
                <input
                  type="text"
                  placeholder="Tìm theo tiêu đề truyện…"
                  value={searchStory}
                  onChange={(e) => setSearchStory(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>
              <button type="submit" className="min-w-[8.5rem] px-6 py-3 border border-transparent bg-amber-700 hover:bg-amber-800 text-white font-medium text-sm rounded-md transition-colors whitespace-nowrap">
                Tìm truyện
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
