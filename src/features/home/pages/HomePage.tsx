import { useState, useEffect, useCallback } from 'react'
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
import { useAuth } from '@/hooks/useAuth'
import { getUserPreferences, hasUserPreferences } from '@/utils/preferences'

export default function HomePage() {
  const { user, isAuthenticated } = useAuth()

  const [latestPoems, setLatestPoems] = useState<PoemResponse[]>([])
  const [randomPoems, setRandomPoems] = useState<PoemResponse[]>([])
  const [authors, setAuthors] = useState<AuthorResponse[]>([])
  const [genres, setGenres] = useState<GenreResponse[]>([])
  const [totalPoems, setTotalPoems] = useState<number | null>(null)
  const [totalAuthors, setTotalAuthors] = useState<number | null>(null)
  const [totalGenres, setTotalGenres] = useState<number | null>(null)
  const [stats, setStats] = useState<LibraryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingRandom, setLoadingRandom] = useState(false)

  const isPersonalized = isAuthenticated && user?.id && hasUserPreferences(user.id)

  const loadRandomPoems = useCallback(async () => {
    setLoadingRandom(true)
    try {
      if (isAuthenticated && user?.id && hasUserPreferences(user.id)) {
        const prefs = getUserPreferences(user.id)
        const poems = await poemService.getRandomPoems({
          authorIds: prefs.authorIds,
          genreIds: prefs.genreIds,
          eras: prefs.eras,
        })
        setRandomPoems(poems || [])
      } else {
        const poems = await poemService.getRandomPoems()
        setRandomPoems(poems || [])
      }
    } catch (err) {
      console.error('Lỗi nạp bài thơ ngẫu nhiên', err)
    } finally {
      setLoadingRandom(false)
    }
  }, [isAuthenticated, user?.id])

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [latestRes, featuredRes, topRes, genresRes, statsRes] = await Promise.allSettled([
          poemService.getLatestPoems({ page: 0, size: 6 }),
          authorService.getFeaturedAuthors(),
          authorService.getTopAuthors({ page: 0, size: 1 }),
          genreService.getGenres({ page: 0, size: 8 }),
          poemService.getStats(),
        ])
        if (statsRes.status === 'fulfilled') setStats(statsRes.value)

        if (latestRes.status === 'fulfilled') {
          setLatestPoems(latestRes.value.content || [])
          setTotalPoems(latestRes.value.amount ?? null)
        }

        // Tổng số tác giả (cho hero + mô tả) lấy từ /top; danh sách hiển thị dùng /featured (ghim tay).
        if (topRes.status === 'fulfilled') setTotalAuthors(topRes.value.amount ?? null)
        if (featuredRes.status === 'fulfilled' && featuredRes.value.length > 0) {
          setAuthors(featuredRes.value)
        } else if (topRes.status === 'fulfilled') {
          setAuthors(topRes.value.content || [])
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
    loadRandomPoems()
  }, [loadRandomPoems])

  // Bốc lại khi người dùng quay lại tab (F5 đã tự gọi ở lần mount đầu).
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadRandomPoems()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [loadRandomPoems])

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
      <HeroBanner totalPoems={totalPoems} totalAuthors={totalAuthors} totalGenres={totalGenres} stats={stats} />

      {/* Random / Personalized Recommendations Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <SectionHeader
            title={isPersonalized ? 'Gợi ý theo sở thích của bạn ✨' : 'Gợi ý ngẫu nhiên'}
            description={
              isPersonalized
                ? 'Tuyển tập ngẫu nhiên dựa trên tác giả, thể loại và kỷ nguyên bạn yêu thích'
                : 'Vài bài thơ để bắt đầu thưởng thức thi ca'
            }
          />

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link
                to={PATHS.PROFILE}
                className="text-xs text-amber-700 dark:text-amber-400 font-semibold hover:underline"
              >
                {isPersonalized ? '⚙️ Chỉnh sửa sở thích' : '✨ Cá nhân hóa sở thích'}
              </Link>
            ) : null}

            <button
              type="button"
              onClick={loadRandomPoems}
              disabled={loadingRandom}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-800 dark:text-amber-300 text-xs font-semibold border border-amber-200 dark:border-slate-700 transition-colors disabled:opacity-50"
              title="Đổi gợi ý ngẫu nhiên khác"
            >
              <span className={loadingRandom ? 'animate-spin inline-block' : ''}>🎲</span>
              <span>{loadingRandom ? 'Đang đổi...' : 'Đổi gợi ý'}</span>
            </button>
          </div>
        </div>

        {randomPoems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {randomPoems.slice(0, 6).map((poem) => (
              <Link
                key={poem.id}
                to={toPoemSlug(poem)}
                className="group p-6 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700/60 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-serif text-lg font-bold text-slate-900 dark:text-amber-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                      {poemDisplayTitle(poem)}
                    </h4>
                    {poem.era && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {poem.era}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    {poemAuthorName(poem)}
                  </p>

                  <p className="text-sm font-serif italic text-slate-600 dark:text-slate-300 line-clamp-2">
                    {poem.content.split('\n')[0]}
                  </p>
                </div>

                <div className="pt-3 flex justify-end">
                  <span className="text-xs text-amber-700 dark:text-amber-400 font-medium group-hover:underline">
                    Đọc toàn bài →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <LatestPoemsSection poems={latestPoems} loading={loading} />

      <section className="space-y-6">
        <SectionHeader
          title="Tác giả tiêu biểu"
          description={
            totalAuthors
              ? `Những tên tuổi lớn của thi ca Việt — trong kho ${formatNumber(totalAuthors)} nhà thơ`
              : 'Những tên tuổi lớn của thi ca Việt'
          }
          linkTo={PATHS.AUTHORS}
          linkLabel="Tất cả tác giả"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
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
