import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { PoemCompositionResponse, GenreResponse } from '@/types'
import { compositionService } from '@/services/composition.service'
import { genreService } from '@/services/genre.service'
import { CompositionCard } from '../components/CompositionCard'
import { CompositionModalForm } from '../components/CompositionModalForm'
import { useAuth } from '@/hooks/useAuth'
import { useGuestCTAModal } from '@/contexts/GuestCTAModalContext'
import { useToast } from '@/contexts/ToastContext'
import { useDebounce } from '@/hooks/useDebounce'
import { Skeleton } from '@/components/ui/Skeleton'
import { IconSearch } from '@/components/ui/icons'
import { Seo } from '@/components/common/Seo'
import { getErrorMessage } from '@/utils/error'

type ActiveTab = 'latest' | 'random' | 'search'

export default function CompositionsPage() {
  const { isAuthenticated } = useAuth()
  const { openModal } = useGuestCTAModal()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  // Tab State
  const initialTab = (searchParams.get('tab') as ActiveTab) || 'latest'
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab)

  // Search & Filter State
  const [keyword, setKeyword] = useState(searchParams.get('q') || '')
  const debouncedKeyword = useDebounce(keyword, 400)
  const [selectedGenreId, setSelectedGenreId] = useState<number | undefined>(
    searchParams.get('genre') ? Number(searchParams.get('genre')) : undefined
  )
  const [genres, setGenres] = useState<GenreResponse[]>([])

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingComposition, setEditingComposition] = useState<PoemCompositionResponse | null>(null)

  // --- TAB 1: LATEST (Infinite Scroll) ---
  const [latestList, setLatestList] = useState<PoemCompositionResponse[]>([])
  const [latestPage, setLatestPage] = useState(0)
  const [latestHasMore, setLatestHasMore] = useState(true)
  const [latestLoading, setLatestLoading] = useState(false)
  const [latestInitialLoaded, setLatestInitialLoaded] = useState(false)

  // --- TAB 2: RANDOM ---
  const [randomList, setRandomList] = useState<PoemCompositionResponse[]>([])
  const [randomLoading, setRandomLoading] = useState(false)

  // --- TAB 3: SEARCH RESULTS ---
  const [searchList, setSearchList] = useState<PoemCompositionResponse[]>([])
  const [searchPage, setSearchPage] = useState(0)
  const [searchHasMore, setSearchHasMore] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchTotal, setSearchTotal] = useState<number | null>(null)

  // Sentinel observer ref for infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Load genres
  useEffect(() => {
    async function fetchGenres() {
      try {
        const res = await genreService.getGenres({ isAll: true })
        setGenres(res.content || [])
      } catch (err) {
        console.error('Lỗi khi tải thể loại:', err)
      }
    }
    fetchGenres()
  }, [])

  // Sync tab with URL
  const changeTab = (tab: ActiveTab) => {
    setActiveTab(tab)
    const newParams = new URLSearchParams(searchParams)
    newParams.set('tab', tab)
    setSearchParams(newParams, { replace: true })
  }

  // --- Fetch Latest Page ---
  const fetchLatestPage = useCallback(
    async (pageToFetch: number) => {
      if (latestLoading) return
      setLatestLoading(true)
      try {
        const res = await compositionService.getLatest(pageToFetch, 10)
        const items = res.content || []
        if (items.length === 0 || items.length < 10) {
          setLatestHasMore(false)
        }
        setLatestList((prev) => (pageToFetch === 0 ? items : [...prev, ...items]))
        setLatestPage(pageToFetch + 1)
      } catch (err) {
        toast(`Lỗi tải danh sách bài thơ: ${getErrorMessage(err)}`)
      } finally {
        setLatestLoading(false)
        setLatestInitialLoaded(true)
      }
    },
    [latestLoading, toast]
  )

  // --- Fetch Random Poems ---
  const fetchRandomPoems = useCallback(async () => {
    setRandomLoading(true)
    try {
      const res = await compositionService.getRandom()
      setRandomList(res.content || [])
    } catch (err) {
      toast(`Lỗi khi tải bài thơ ngẫu nhiên: ${getErrorMessage(err)}`)
    } finally {
      setRandomLoading(false)
    }
  }, [toast])

  // --- Fetch Search Results ---
  const fetchSearchResults = useCallback(
    async (pageToFetch: number, kw: string, gId?: number) => {
      setSearchLoading(true)
      try {
        const res = await compositionService.search({
          keyword: kw || undefined,
          genreId: gId,
          page: pageToFetch,
          size: 10,
        })
        const items = res.content || []
        if (items.length === 0 || items.length < 10) {
          setSearchHasMore(false)
        }
        setSearchList((prev) => (pageToFetch === 0 ? items : [...prev, ...items]))
        setSearchTotal(res.totalElements)
        setSearchPage(pageToFetch + 1)
      } catch (err) {
        toast(`Lỗi tìm kiếm: ${getErrorMessage(err)}`)
      } finally {
        setSearchLoading(false)
      }
    },
    [toast]
  )

  // Initial load according to active tab
  useEffect(() => {
    if (activeTab === 'latest' && !latestInitialLoaded) {
      fetchLatestPage(0)
    } else if (activeTab === 'random' && randomList.length === 0) {
      fetchRandomPoems()
    }
  }, [activeTab, latestInitialLoaded, fetchLatestPage, randomList.length, fetchRandomPoems])

  // Search effect
  useEffect(() => {
    const isSearching = Boolean(debouncedKeyword.trim() || selectedGenreId)
    if (isSearching) {
      setActiveTab('search')
      setSearchPage(0)
      setSearchHasMore(true)
      fetchSearchResults(0, debouncedKeyword.trim(), selectedGenreId)
    } else if (activeTab === 'search') {
      setActiveTab('latest')
    }
  }, [debouncedKeyword, selectedGenreId, fetchSearchResults, activeTab])

  // Infinite Scroll Trigger (Sentinel Ref callback)
  const lastItemRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (latestLoading || searchLoading) return
      if (observerRef.current) observerRef.current.disconnect()

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          if (activeTab === 'latest' && latestHasMore) {
            fetchLatestPage(latestPage)
          } else if (activeTab === 'search' && searchHasMore) {
            fetchSearchResults(searchPage, debouncedKeyword.trim(), selectedGenreId)
          }
        }
      })

      if (node) observerRef.current.observe(node)
    },
    [
      latestLoading,
      searchLoading,
      activeTab,
      latestHasMore,
      latestPage,
      fetchLatestPage,
      searchHasMore,
      searchPage,
      debouncedKeyword,
      selectedGenreId,
      fetchSearchResults,
    ]
  )

  const handleOpenCreateModal = () => {
    if (!isAuthenticated) {
      openModal('đăng bài thơ sáng tác mới')
      return
    }
    setEditingComposition(null)
    setIsModalOpen(true)
  }

  const handleEdit = (item: PoemCompositionResponse) => {
    setEditingComposition(item)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài thơ này không?')) return
    try {
      await compositionService.delete(id)
      setLatestList((prev) => prev.filter((p) => p.id !== id))
      setRandomList((prev) => prev.filter((p) => p.id !== id))
      setSearchList((prev) => prev.filter((p) => p.id !== id))
      toast('Đã xóa bài thơ thành công!')
    } catch (err) {
      toast(`Không thể xóa bài thơ: ${getErrorMessage(err)}`)
    }
  }

  const handleModalSuccess = (saved: PoemCompositionResponse) => {
    if (editingComposition) {
      setLatestList((prev) => prev.map((p) => (p.id === saved.id ? saved : p)))
      setRandomList((prev) => prev.map((p) => (p.id === saved.id ? saved : p)))
      setSearchList((prev) => prev.map((p) => (p.id === saved.id ? saved : p)))
    } else {
      setLatestList((prev) => [saved, ...prev])
      if (activeTab !== 'latest') {
        changeTab('latest')
      }
    }
  }

  return (
    <>
      <Seo
        title="Góc Sáng Tác Thơ – Nơi hội ngộ tác giả & độc giả"
        description="Khám phá các tác phẩm thơ tự sáng tác của cộng đồng độc giả. Đăng tải và chia sẻ những vần thơ của chính bạn trên Tiểu Thi Hào."
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Top Hero Section */}
        <section className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-200/70 dark:border-slate-800/70 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-500 mb-1">
              Góc thơ tự sáng tác
            </p>
            <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-amber-100">
              Góc Sáng Tác
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Nơi hội ngộ của những tâm hồn yêu thơ. Hãy chia sẻ cảm xúc, trải lòng qua từng con chữ
              và cùng thưởng thức những sáng tác mới nhất từ cộng đồng độc giả.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-md bg-amber-700 hover:bg-amber-800 text-white font-semibold text-sm transition-colors"
            >
              Đăng bài thơ mới
            </button>
            <button
              type="button"
              onClick={() => {
                changeTab('random')
                fetchRandomPoems()
              }}
              className="px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Khám phá ngẫu nhiên
            </button>
          </div>
        </section>

        {/* Filter & Search Toolbar */}
        <section className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="md:col-span-8 relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <IconSearch size={18} />
              </span>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm bài thơ theo tiêu đề, tác giả, nội dung..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
              {keyword && (
                <button
                  type="button"
                  onClick={() => setKeyword('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Genre Select Filter */}
            <div className="md:col-span-4">
              <select
                value={selectedGenreId || ''}
                onChange={(e) => setSelectedGenreId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              >
                <option value="">-- Tất cả thể thơ --</option>
                {genres.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => changeTab('latest')}
                className={`px-4 py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors ${
                  activeTab === 'latest'
                    ? 'bg-amber-700 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Mới nhất
              </button>

              <button
                type="button"
                onClick={() => {
                  changeTab('random')
                  if (randomList.length === 0) fetchRandomPoems()
                }}
                className={`px-4 py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors ${
                  activeTab === 'random'
                    ? 'bg-amber-700 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Khám phá ngẫu nhiên
              </button>

              {activeTab === 'search' && (
                <span className="px-4 py-2 rounded-md text-xs sm:text-sm font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300">
                  Kết quả tìm kiếm ({searchTotal ?? searchList.length})
                </span>
              )}
            </div>

            {activeTab === 'random' && (
              <button
                type="button"
                onClick={fetchRandomPoems}
                disabled={randomLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-lg transition-colors disabled:opacity-50"
              >
                <svg
                  className={`w-3.5 h-3.5 ${randomLoading ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Đổi danh sách khác</span>
              </button>
            )}
          </div>
        </section>

        {/* FEED SECTION */}
        <section className="space-y-6">
          {/* TAB 1: LATEST */}
          {activeTab === 'latest' && (
            <div className="space-y-6">
              {latestList.map((item, index) => {
                const isTrigger = index === latestList.length - 2 || index === latestList.length - 1
                return (
                  <div key={item.id} ref={isTrigger ? lastItemRef : undefined}>
                    <CompositionCard
                      composition={item}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  </div>
                )
              })}

              {latestLoading && (
                <div className="space-y-4 pt-2">
                  <Skeleton className="h-44 w-full rounded-xl" />
                  <Skeleton className="h-44 w-full rounded-xl" />
                </div>
              )}

              {!latestLoading && latestList.length === 0 && (
                <div className="text-center py-16 bg-white dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8">
                  <h3 className="font-serif text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Chưa có bài thơ sáng tác nào
                  </h3>
                  <p className="text-slate-500 text-sm mb-5">
                    Hãy là người đầu tiên gieo những vần thơ đầu tiên tại Góc Sáng Tác!
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-sm transition-colors inline-flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Sáng tác bài thơ đầu tiên</span>
                  </button>
                </div>
              )}

              {!latestHasMore && latestList.length > 0 && (
                <p className="text-center text-xs text-slate-400 py-6">
                  Bạn đã xem hết các bài thơ mới nhất.
                </p>
              )}
            </div>
          )}

          {/* TAB 2: RANDOM */}
          {activeTab === 'random' && (
            <div className="space-y-6">
              {randomLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-44 w-full rounded-xl" />
                  <Skeleton className="h-44 w-full rounded-xl" />
                  <Skeleton className="h-44 w-full rounded-xl" />
                </div>
              ) : randomList.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8">
                  <p className="text-slate-500 text-sm mb-4">Chưa có bài thơ nào trong danh sách ngẫu nhiên.</p>
                  <button
                    type="button"
                    onClick={fetchRandomPoems}
                    className="px-4 py-2 rounded-xl bg-amber-700 text-white text-xs font-semibold"
                  >
                    Thử lại
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-6">
                    {randomList.map((item) => (
                      <CompositionCard
                        key={item.id}
                        composition={item}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>

                  <div className="text-center pt-4">
                    <button
                      type="button"
                      onClick={fetchRandomPoems}
                      className="px-6 py-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold transition-colors inline-flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      <span>Khám phá thêm 10 bài ngẫu nhiên khác</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: SEARCH RESULTS */}
          {activeTab === 'search' && (
            <div className="space-y-6">
              {searchList.map((item, index) => {
                const isTrigger = index === searchList.length - 2 || index === searchList.length - 1
                return (
                  <div key={item.id} ref={isTrigger ? lastItemRef : undefined}>
                    <CompositionCard
                      composition={item}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  </div>
                )
              })}

              {searchLoading && (
                <div className="space-y-4 pt-2">
                  <Skeleton className="h-44 w-full rounded-xl" />
                  <Skeleton className="h-44 w-full rounded-xl" />
                </div>
              )}

              {!searchLoading && searchList.length === 0 && (
                <div className="text-center py-16 bg-white dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8">
                  <p className="text-slate-500 text-sm">
                    Không tìm thấy bài thơ nào phù hợp với từ khóa & bộ lọc đã chọn.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Create / Edit Modal */}
      <CompositionModalForm
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingComposition(null)
        }}
        onSuccess={handleModalSuccess}
        editComposition={editingComposition}
      />
    </>
  )
}
