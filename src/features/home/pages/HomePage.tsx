import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { poemService } from '@/services/poem.service'
import { authorService } from '@/services/author.service'
import { genreService } from '@/services/genre.service'
import type { PoemResponse, AuthorResponse, GenreResponse, LibraryStats } from '@/types'
import { PATHS, toAuthorDetail, toGenreDetail, toPoemSlug } from '@/routes/paths'
import { HeroBanner } from '../components/HeroBanner'
import { LatestPoemsSection } from '../components/LatestPoemsSection'
import { SectionHeader } from '../components/SectionHeader'
import { poemDisplayTitle, poemAuthorName } from '@/features/poems/display'
import { Seo } from '@/components/common/Seo'
import { formatNumber } from '@/utils/format'
import { AuthorAvatar } from '@/features/authors/components/AuthorAvatar'

export default function HomePage() {
  const [latestPoems, setLatestPoems] = useState<PoemResponse[]>([])
  const [randomPoems, setRandomPoems] = useState<PoemResponse[]>([])
  const [authors, setAuthors] = useState<AuthorResponse[]>([])
  const [genres, setGenres] = useState<GenreResponse[]>([])
  const [totalPoems, setTotalPoems] = useState<number | null>(null)
  const [totalAuthors, setTotalAuthors] = useState<number | null>(null)
  const [totalGenres, setTotalGenres] = useState<number | null>(null)
  const [stats, setStats] = useState<LibraryStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [latestRes, randomRes, authorsRes, genresRes, statsRes] = await Promise.allSettled([
          poemService.getLatestPoems({ page: 0, size: 6 }),
          poemService.getRandomPoems(),
          authorService.getTopAuthors({ page: 0, size: 6 }),
          genreService.getGenres({ page: 0, size: 8 }),
          poemService.getStats(),
        ])
        if (statsRes.status === 'fulfilled') setStats(statsRes.value)

        if (latestRes.status === 'fulfilled') {
          setLatestPoems(latestRes.value.content || [])
          setTotalPoems(latestRes.value.amount ?? null)
        }
        if (randomRes.status === 'fulfilled') setRandomPoems(randomRes.value || [])
        if (authorsRes.status === 'fulfilled') {
          setAuthors(authorsRes.value.content || [])
          setTotalAuthors(authorsRes.value.amount ?? null)
        }
        if (genresRes.status === 'fulfilled') {
          setGenres(genresRes.value.content || [])
          setTotalGenres(genresRes.value.amount ?? null)
        }
      } catch (err) {
        console.error('Lỗi tải dữ liệu trang chủ', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <div className="space-y-14 py-4">
      <Seo
        path="/"
        description={
          totalPoems
            ? `${formatNumber(totalPoems)} bài thơ Việt Nam và thế giới — tra cứu theo tác giả, thể loại, đọc nguyên tác kèm phiên âm, dịch nghĩa và nhiều bản dịch.`
            : undefined
        }
      />
      <HeroBanner totalPoems={totalPoems} totalAuthors={totalAuthors} totalGenres={totalGenres} />

      {stats && stats.total_poems > 0 && (
        <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/40 px-5 py-4 md:px-6 md:py-5">
          <p className="text-sm md:text-base text-slate-700 dark:text-slate-200 leading-relaxed">
            <span className="font-serif font-semibold text-slate-900 dark:text-amber-100">Thư viện thơ:</span>{' '}
            <strong className="text-amber-700 dark:text-amber-400">{formatNumber(stats.total_poems)}</strong> tác phẩm của{' '}
            <strong className="text-amber-700 dark:text-amber-400">{formatNumber(stats.total_authors)}</strong> tác giả từ{' '}
            <strong className="text-amber-700 dark:text-amber-400">{formatNumber(stats.total_countries)}</strong> nước, trong đó:
          </p>
          <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
            <li>· <strong>{formatNumber(stats.viet_count)}</strong> bài tiếng Việt</li>
            <li>· <strong>{formatNumber(stats.han_count)}</strong> bài chữ Hán</li>
            <li>· <strong>{formatNumber(stats.foreign_count)}</strong> bài tiếng nước ngoài khác</li>
          </ul>
        </section>
      )}

      <LatestPoemsSection poems={latestPoems} loading={loading} />

      {randomPoems.length > 0 && (
        <section className="space-y-6">
          <SectionHeader title="Gợi ý ngẫu nhiên" description="Vài bài thơ để bắt đầu" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {randomPoems.slice(0, 4).map((poem) => (
              <Link
                key={poem.id}
                to={toPoemSlug(poem)}
                className="p-6 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700/60 transition-colors"
              >
                <h4 className="font-serif text-lg font-bold text-slate-900 dark:text-amber-100 mb-1">
                  {poemDisplayTitle(poem)}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  {poemAuthorName(poem)}
                </p>
                <p className="text-sm font-serif italic text-slate-600 dark:text-slate-300 line-clamp-2">
                  {poem.content.split('\n')[0]}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-6">
        <SectionHeader
          title="Tác giả tiêu biểu"
          description={
            totalAuthors
              ? `${formatNumber(totalAuthors)} nhà thơ trong kho — xếp theo số bài thơ`
              : 'Các nhà thơ trong kho'
          }
          linkTo={PATHS.AUTHORS}
          linkLabel="Tất cả tác giả"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {authors.map((author) => (
            <Link
              key={author.id}
              to={toAuthorDetail(author.id)}
              className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center hover:border-amber-300 dark:hover:border-amber-700/60 transition-colors"
            >
              <AuthorAvatar author={author} size={56} className="mx-auto mb-3" />
              <h4 className="font-serif font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                {author.name}
              </h4>
              {(author.poemCount ?? author.poem_count) != null && (
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-0.5">
                  {formatNumber(author.poemCount ?? author.poem_count ?? 0)} bài thơ
                </p>
              )}
              {(author.birthYear || author.hometown) && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {author.birthYear || author.hometown}
                </p>
              )}
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeader
          title="Thể loại"
          description="Lục bát, thất ngôn, thơ tự do…"
          linkTo={PATHS.GENRES}
          linkLabel="Tất cả thể loại"
        />
        <div className="flex flex-wrap gap-3">
          {genres.map((genre) => (
            <Link
              key={genre.id}
              to={toGenreDetail(genre.id)}
              className="px-4 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-amber-700 hover:text-white hover:border-amber-700 dark:hover:bg-amber-600 dark:hover:border-amber-600 transition-colors"
            >
              {genre.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
