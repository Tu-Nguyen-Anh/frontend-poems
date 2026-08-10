import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { poemService } from '@/services/poem.service'
import { authorService } from '@/services/author.service'
import { genreService } from '@/services/genre.service'
import type { PoemResponse, AuthorResponse, GenreResponse } from '@/types'
import { PATHS, toAuthorDetail, toGenreDetail, toPoemDetail } from '@/routes/paths'
import { HeroBanner } from '../components/HeroBanner'
import { LatestPoemsSection } from '../components/LatestPoemsSection'

export default function HomePage() {
  const [latestPoems, setLatestPoems] = useState<PoemResponse[]>([])
  const [randomPoems, setRandomPoems] = useState<PoemResponse[]>([])
  const [authors, setAuthors] = useState<AuthorResponse[]>([])
  const [genres, setGenres] = useState<GenreResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [latestRes, randomRes, authorsRes, genresRes] = await Promise.allSettled([
          poemService.getLatestPoems({ page: 0, size: 6 }),
          poemService.getRandomPoems(),
          authorService.getAuthors({ page: 0, size: 6 }),
          genreService.getGenres({ page: 0, size: 8 }),
        ])

        if (latestRes.status === 'fulfilled') setLatestPoems(latestRes.value.content || [])
        if (randomRes.status === 'fulfilled') setRandomPoems(randomRes.value || [])
        if (authorsRes.status === 'fulfilled') setAuthors(authorsRes.value.content || [])
        if (genresRes.status === 'fulfilled') setGenres(genresRes.value.content || [])
      } catch (err) {
        console.error('Lỗi tải dữ liệu trang chủ', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <div className="space-y-16 py-4">
      {/* Hero Banner */}
      <HeroBanner />

      {/* Latest Poems Section */}
      <LatestPoemsSection poems={latestPoems} loading={loading} />

      {/* Random Recommendations */}
      {randomPoems.length > 0 && (
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 dark:text-amber-100">
              ✨ Thơ Ngẫu Nhiên Gợi Ý
            </h2>
            <p className="text-[#8B5CF6] dark:text-[#A78BFA] text-sm font-medium">Thưởng thức mỗi khoảnh khắc hứng khởi</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {randomPoems.slice(0, 4).map((poem) => (
              <Link
                key={poem.id}
                to={toPoemDetail(poem.id)}
                className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-transparent dark:from-amber-950/20 border border-amber-500/20 hover:border-amber-500/40 transition shadow-sm"
              >
                <h4 className="text-lg font-serif font-bold text-slate-900 dark:text-amber-200 mb-1">
                  {poem.name}
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-2">
                  Tác giả: {poem.authorName || 'Vô danh'}
                </p>
                <p className="text-sm font-serif italic text-slate-700 dark:text-slate-300 line-clamp-2">
                  "{poem.content.split('\n')[0]}..."
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Authors */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 dark:text-amber-100">
              ✍️ Tác Giả Tiêu Biểu
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Các thi sĩ đại thụ tên tuổi</p>
          </div>
          <Link
            to={PATHS.AUTHORS}
            className="text-amber-700 dark:text-amber-400 font-medium text-sm hover:underline flex items-center gap-1"
          >
            Tất cả tác giả →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {authors.map((author) => (
            <Link
              key={author.id}
              to={toAuthorDetail(author.id)}
              className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 text-center hover:border-amber-500 hover:shadow-lg transition transform hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 flex items-center justify-center font-serif font-bold text-xl mx-auto mb-3 shadow-inner">
                {author.name.charAt(0)}
              </div>
              <h4 className="font-serif font-bold text-slate-900 dark:text-slate-100 text-sm line-clamp-1">
                {author.name}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {author.birthYear ? `Năm ${author.birthYear}` : author.hometown || 'Việt Nam'}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Genres Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 dark:text-amber-100">
              🏷️ Thể Loại Thơ Ca
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Từ Lục bát, Thất ngôn tứ tuyệt đến Thơ tự do</p>
          </div>
          <Link
            to={PATHS.GENRES}
            className="text-amber-700 dark:text-amber-400 font-medium text-sm hover:underline flex items-center gap-1"
          >
            Tất cả thể loại →
          </Link>
        </div>

        <div className="flex flex-wrap gap-3">
          {genres.map((genre) => (
            <Link
              key={genre.id}
              to={toGenreDetail(genre.id)}
              className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-500 dark:hover:text-slate-950 font-medium text-sm text-slate-700 dark:text-slate-300 transition shadow-sm border border-slate-200 dark:border-slate-700"
            >
              🏷️ {genre.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
