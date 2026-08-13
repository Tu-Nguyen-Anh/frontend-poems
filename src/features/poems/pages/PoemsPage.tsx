import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { poemService } from '@/services/poem.service'
import { genreService } from '@/services/genre.service'
import { useDebounce } from '@/hooks/useDebounce'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import type { PoemResponse, GenreResponse } from '@/types'
import { toPoemSlug } from '@/routes/paths'
import { Skeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/ui/Pagination'
import { IconSearch, IconList, IconGrid } from '@/components/ui/icons'
import { poemDisplayTitle, poemAuthorName, poemGenreName } from '@/features/poems/display'
import { Seo } from '@/components/common/Seo'
import { BrowseContext, type BrowseSelection, type Ref } from '@/features/browse/browseContext'
import { BrowseTree } from '@/features/browse/components/BrowseTree'
import { languageLabel } from '@/features/browse/labels'

export default function PoemsPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const urlKeyword = searchParams.get('keyword') || ''

  const [keyword, setKeyword] = useState(urlKeyword)
  const debouncedKeyword = useDebounce(keyword, 300)
  const [page, setPage] = useState(0)
  const size = 9

  const [poems, setPoems] = useState<PoemResponse[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [genres, setGenres] = useState<GenreResponse[]>([])
  // Các chiều lọc = một đường dẫn duyệt (đồng bộ với cây bên trái).
  const [selectedGenre, setSelectedGenre] = useState<Ref | null>(null)
  const [selectedAuthor, setSelectedAuthor] = useState<Ref | null>(null)
  const [eras, setEras] = useState<string[]>([])
  const [selectedEra, setSelectedEra] = useState<string>('')
  const [languages, setLanguages] = useState<string[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [view, setView] = useLocalStorage<'list' | 'grid'>('poems_view', 'list')

  // Đồng bộ khi ô tìm kiếm ở Header đổi URL (?keyword=…) — giữ realtime xuyên trang.
  useEffect(() => {
    setKeyword(urlKeyword)
    setPage(0)
  }, [urlKeyword])

  useEffect(() => {
    async function fetchFilters() {
      try {
        const [genreRes, eraRes, langRes] = await Promise.all([
          genreService.getGenres({ isAll: true }),
          poemService.getEras(),
          poemService.getLanguages(),
        ])
        setGenres(genreRes.content || [])
        setEras(eraRes)
        setLanguages(langRes)
      } catch (err) {
        console.error(err)
      }
    }
    fetchFilters()
  }, [])

  const anyBrowseFilter = !!(selectedLanguage || selectedEra || selectedGenre || selectedAuthor)

  useEffect(() => {
    async function fetchPoems() {
      setLoading(true)
      try {
        // Có từ khoá → tìm kiếm xếp hạng (getPoems). Không có mà đang lọc theo
        // cây (ngôn ngữ/thời kỳ/thể thơ/tác giả) → browsePoems (hỗ trợ authorId
        // và rổ "(Chưa phân loại)"). Mặc định không lọc → giữ getPoems như cũ.
        const res =
          debouncedKeyword
            ? await poemService.getPoems({
                keyword: debouncedKeyword,
                genreId: selectedGenre?.id,
                era: selectedEra || undefined,
                language: selectedLanguage || undefined,
                page,
                size,
              })
            : anyBrowseFilter
              ? await poemService.browsePoems({
                  language: selectedLanguage || undefined,
                  era: selectedEra || undefined,
                  genreId: selectedGenre?.id,
                  authorId: selectedAuthor?.id,
                  page,
                  size,
                })
              : await poemService.getPoems({ page, size })
        setPoems(res.content || [])
        setTotalAmount(res.amount || 0)
      } catch (err) {
        console.error('Lỗi tải danh sách bài thơ', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPoems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedKeyword, selectedGenre?.id, selectedEra, selectedLanguage, selectedAuthor?.id, page])

  const totalPages = Math.ceil(totalAmount / size) || 1

  // ----- Cây điều hướng bên trái: chọn nhánh nào thì lọc danh sách theo đó -----
  const selection: BrowseSelection = useMemo(
    () => ({
      language: selectedLanguage || undefined,
      era: selectedEra || undefined,
      genre: selectedGenre ?? undefined,
      author: selectedAuthor ?? undefined,
    }),
    [selectedLanguage, selectedEra, selectedGenre, selectedAuthor],
  )

  const applyPath = useCallback((s: BrowseSelection) => {
    setSelectedLanguage(s.language ?? '')
    setSelectedEra(s.era ?? '')
    setSelectedGenre(s.genre ?? null)
    setSelectedAuthor(s.author ?? null)
    setKeyword('')
    setPage(0)
  }, [])

  const browseValue = useMemo(
    () => ({
      selection,
      selectLanguage: (language: string) => applyPath({ language }),
      selectEra: (era: string) => applyPath({ language: selection.language, era }),
      selectGenre: (genre: Ref) => applyPath({ language: selection.language, era: selection.era, genre }),
      selectAuthor: (author: Ref) =>
        applyPath({ language: selection.language, era: selection.era, genre: selection.genre, author }),
      selectPoem: (poem: { id: number; name?: string; author?: string }) =>
        navigate(toPoemSlug({ id: poem.id, name: poem.name, authorName: poem.author })),
      selectPath: (s: BrowseSelection) => applyPath(s),
    }),
    [selection, applyPath, navigate],
  )

  const clearBrowse = () => applyPath({})

  return (
    <div className="flex gap-6 py-4">
      {/* Cây điều hướng — bê từ trang Duyệt sang */}
      <aside className="thin-scrollbar hidden lg:block w-60 flex-shrink-0 self-start sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900">
        <BrowseContext.Provider value={browseValue}>
          <BrowseTree />
        </BrowseContext.Provider>
      </aside>

      {/* Nội dung kho thơ */}
      <div className="flex-1 min-w-0 space-y-8">
        <Seo
          title="Kho tàng bài thơ"
          description="Duyệt toàn bộ bài thơ theo thể loại, tìm theo tên bài, tác giả hoặc một câu thơ."
          path="/poems"
        />
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-amber-100 mb-2">
            Kho tàng bài thơ
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Danh tác thi đàn Việt Nam và thế giới
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="relative w-full md:w-96">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <IconSearch size={16} />
            </span>
            <input
              type="text"
              placeholder="Tìm theo tên bài, tác giả, hoặc một câu thơ…"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value)
                setPage(0)
              }}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full md:w-auto">
            <select
              value={selectedGenre?.id ?? ''}
              onChange={(e) => {
                const id = e.target.value ? Number(e.target.value) : null
                const g = genres.find((x) => x.id === id)
                setSelectedGenre(id ? { id, label: g?.name ?? '' } : null)
                setPage(0)
              }}
              aria-label="Lọc theo thể loại"
              className="w-full md:w-44 px-3 py-2 text-sm rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
            >
              <option value="">Tất cả thể loại</option>
              {genres.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>

            <select
              value={selectedEra}
              onChange={(e) => {
                setSelectedEra(e.target.value)
                setPage(0)
              }}
              aria-label="Lọc theo thời kỳ"
              className="w-full md:w-44 px-3 py-2 text-sm rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
            >
              <option value="">Tất cả thời kỳ</option>
              {eras.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>

            <select
              value={selectedLanguage}
              onChange={(e) => {
                setSelectedLanguage(e.target.value)
                setPage(0)
              }}
              aria-label="Lọc theo ngôn ngữ"
              className="w-full md:w-36 px-3 py-2 text-sm rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
            >
              <option value="">Mọi ngôn ngữ</option>
              {languages.map((l) => (
                <option key={l} value={l}>
                  {languageLabel(l)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Đường dẫn đang lọc (từ cây) + nút xoá */}
        {selectedAuthor && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500 dark:text-slate-400">Đang xem tác giả:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-medium">
              {selectedAuthor.label}
            </span>
            <button onClick={clearBrowse} className="text-slate-400 hover:text-amber-700" title="Bỏ lọc">
              ✕ bỏ lọc
            </button>
          </div>
        )}

        {/* Result count + view switch */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {totalAmount.toLocaleString('vi-VN')} bài thơ
            {totalPages > 1 && <span className="text-slate-400"> · Trang {page + 1}/{totalPages.toLocaleString('vi-VN')}</span>}
          </p>
          <div className="flex items-center gap-0.5 p-0.5 rounded-md border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setView('list')}
              aria-label="Dạng danh sách"
              title="Dạng danh sách"
              className={`p-1.5 rounded transition-colors ${
                view === 'list'
                  ? 'bg-amber-700 text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <IconList size={16} />
            </button>
            <button
              onClick={() => setView('grid')}
              aria-label="Dạng lưới"
              title="Dạng lưới"
              className={`p-1.5 rounded transition-colors ${
                view === 'grid'
                  ? 'bg-amber-700 text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <IconGrid size={16} />
            </button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          view === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-56 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          )
        ) : poems.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
            <h3 className="text-lg font-serif font-bold text-slate-700 dark:text-slate-300 mb-1">
              Không tìm thấy bài thơ nào
            </h3>
            <p className="text-slate-400 text-xs">Thử tìm với từ khóa khác hoặc bỏ lọc thể loại</p>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {poems.map((poem) => (
              <Link
                key={poem.id}
                to={toPoemSlug(poem)}
                className="group p-6 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-amber-300 dark:hover:border-amber-700/60 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300">
                      {poemGenreName(poem)}
                    </span>
                    {poem.era && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-300">
                        {poem.era}
                      </span>
                    )}
                    {poem.year && <span className="text-xs text-slate-400 font-mono">{poem.year}</span>}
                  </div>
                  <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-amber-100 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors line-clamp-1 mb-1">
                    {poemDisplayTitle(poem)}
                  </h3>
                  <p className="text-xs font-medium text-amber-700/80 dark:text-amber-400/80 mb-3">
                    {poemAuthorName(poem)}
                  </p>
                  <div className="text-slate-600 dark:text-slate-300 text-sm font-serif italic line-clamp-4 leading-relaxed whitespace-pre-line bg-amber-50/40 dark:bg-slate-900/40 p-3 rounded-xl border border-amber-900/5">
                    {poem.content}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50 text-xs text-slate-400">
                  <span>Đọc tiếp</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {poems.map((poem) => (
              <Link
                key={poem.id}
                to={toPoemSlug(poem)}
                className="group flex items-start justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700/60 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300">
                      {poemGenreName(poem)}
                    </span>
                    {poem.era && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-300">
                        {poem.era}
                      </span>
                    )}
                    {poem.year && <span className="text-xs text-slate-400 font-mono">{poem.year}</span>}
                  </div>
                  <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-amber-100 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors truncate">
                    {poemDisplayTitle(poem)}
                  </h3>
                  <p className="text-xs font-medium text-amber-700/80 dark:text-amber-400/80">
                    {poemAuthorName(poem)}
                  </p>
                  <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 font-serif italic line-clamp-2 whitespace-pre-line">
                    {poem.content}
                  </p>
                </div>
                <span className="flex-shrink-0 self-center text-slate-300 dark:text-slate-600 group-hover:text-amber-600 transition-colors">
                  →
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={setPage}
          totalItems={totalAmount}
          itemLabel="bài thơ"
        />
      </div>
    </div>
  )
}
