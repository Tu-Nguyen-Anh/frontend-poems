import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PATHS } from '@/routes/paths'
import { IconSearch } from '@/components/ui/icons'
import { formatNumber } from '@/utils/format'
import { useDebounce } from '@/hooks/useDebounce'
import type { LibraryStats } from '@/types'

interface HeroBannerProps {
  totalPoems?: number | null
  totalAuthors?: number | null
  totalGenres?: number | null
  stats?: LibraryStats | null
}

export function HeroBanner({ totalPoems, totalAuthors, totalGenres, stats }: HeroBannerProps) {
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

        {totalPoems != null && totalPoems > 0 && (
          <dl className="flex flex-nowrap justify-between gap-x-3 sm:flex-wrap sm:justify-start sm:gap-x-10 sm:gap-y-4 pt-2">
            <div>
              <dt className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                Bài thơ
              </dt>
              <dd className="font-serif text-lg sm:text-2xl md:text-3xl font-bold text-amber-700 dark:text-amber-400">
                {formatNumber(totalPoems)}
              </dd>
            </div>
            {totalAuthors != null && totalAuthors > 0 && (
              <div>
                <dt className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  Tác giả
                </dt>
                <dd className="font-serif text-lg sm:text-2xl md:text-3xl font-bold text-amber-700 dark:text-amber-400">
                  {formatNumber(totalAuthors)}
                </dd>
              </div>
            )}
            {totalGenres != null && totalGenres > 0 && (
              <div>
                <dt className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  Thể loại
                </dt>
                <dd className="font-serif text-lg sm:text-2xl md:text-3xl font-bold text-amber-700 dark:text-amber-400">
                  {formatNumber(totalGenres)}
                </dd>
              </div>
            )}
            {stats != null && stats.total_countries > 0 && (
              <div>
                <dt className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  Quốc gia
                </dt>
                <dd className="font-serif text-lg sm:text-2xl md:text-3xl font-bold text-amber-700 dark:text-amber-400">
                  {formatNumber(stats.total_countries)}
                </dd>
              </div>
            )}
          </dl>
        )}

        {stats != null && stats.total_poems > 0 && (
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 pt-1">
            Trong đó{' '}
            <span className="font-semibold text-amber-700 dark:text-amber-400">{formatNumber(stats.viet_count)}</span> bài tiếng Việt
            {' · '}
            <span className="font-semibold text-amber-700 dark:text-amber-400">{formatNumber(stats.han_count)}</span> bài chữ Hán
            {' · '}
            <span className="font-semibold text-amber-700 dark:text-amber-400">{formatNumber(stats.foreign_count)}</span> bài tiếng nước ngoài khác
          </p>
        )}

        <form onSubmit={handleSearch} className="flex gap-2 max-w-md pt-1">
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
          <button
            type="submit"
            className="px-6 py-3 bg-amber-700 hover:bg-amber-800 text-white font-medium text-sm rounded-md transition-colors"
          >
            Tìm thơ
          </button>
        </form>
      </div>
    </section>
  )
}
