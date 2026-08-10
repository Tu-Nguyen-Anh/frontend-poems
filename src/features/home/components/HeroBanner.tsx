import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PATHS } from '@/routes/paths'

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
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-900 via-amber-800 to-stone-900 text-white p-8 md:p-14 shadow-2xl">
      <div className="absolute -right-10 -bottom-10 opacity-10 text-[200px] select-none font-serif">
        詩
      </div>
      <div className="relative z-10 max-w-2xl space-y-6">
        <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-400/30">
          Tôn vinh Thơ Ca Việt Nam
        </span>
        <h1 className="text-3xl md:text-5xl font-serif font-bold leading-tight tracking-tight text-amber-50">
          Lắng Nghe Giai Điệu Hồn Thơ Việt
        </h1>
        <p className="text-amber-200/80 text-sm md:text-base leading-relaxed">
          Hàng ngàn kiệt tác thơ cổ điển và hiện đại. Trải nghiệm đọc thơ tinh tế với chế độ hoài cổ Sepia và giao diện phẳng hiện đại.
        </p>

        <form onSubmit={handleSearch} className="flex gap-2 max-w-md pt-2">
          <input
            type="text"
            placeholder="Nhập tên bài thơ, tác giả..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-amber-200/50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg transition transform active:scale-95"
          >
            Tìm Thơ
          </button>
        </form>
      </div>
    </section>
  )
}
