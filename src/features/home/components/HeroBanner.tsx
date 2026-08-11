import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PATHS } from '@/routes/paths'
import { IconSearch } from '@/components/ui/icons'

export function HeroBanner() {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

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
          Hàng nghìn bài thơ cổ điển và hiện đại, tra cứu theo tác giả và thể loại,
          đọc trong chế độ đọc cổ điển hoặc hiện đại.
        </p>

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
