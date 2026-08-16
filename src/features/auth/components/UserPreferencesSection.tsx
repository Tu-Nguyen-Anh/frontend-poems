import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { authorService } from '@/services/author.service'
import { genreService } from '@/services/genre.service'
import { poemService } from '@/services/poem.service'
import { getUserPreferences, saveUserPreferences } from '@/utils/preferences'
import { useToast } from '@/contexts/ToastContext'
import { toPoemSlug } from '@/routes/paths'
import { poemDisplayTitle, poemAuthorName, poemGenreName } from '@/features/poems/display'
import type { AuthorResponse, GenreResponse, PoemResponse, UserPreferences } from '@/types'

interface UserPreferencesSectionProps {
  userId: number | string
}

const MAX_PER_CATEGORY = 3

export function UserPreferencesSection({ userId }: UserPreferencesSectionProps) {
  const { toast } = useToast()

  const [preferences, setPreferences] = useState<UserPreferences>(() => getUserPreferences(userId))
  const [authorsList, setAuthorsList] = useState<AuthorResponse[]>([])
  const [genresList, setGenresList] = useState<GenreResponse[]>([])
  const [erasList, setErasList] = useState<string[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  useEffect(() => {
    setPreferences(getUserPreferences(userId))
  }, [userId])


  const [authorSearch, setAuthorSearch] = useState('')
  const [authorDropdownOpen, setAuthorDropdownOpen] = useState(false)

  const [recommendedPoems, setRecommendedPoems] = useState<PoemResponse[]>([])
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
  const [savingPreferences, setSavingPreferences] = useState(false)

  // Load all options for authors, genres, and eras
  useEffect(() => {
    async function loadOptions() {
      setLoadingOptions(true)
      try {
        const [authorsRes, genresRes, erasRes] = await Promise.allSettled([
          authorService.getAuthors({ isAll: true, size: 100 }),
          genreService.getGenres({ isAll: true, size: 50 }),
          poemService.getEras(),
        ])

        if (authorsRes.status === 'fulfilled') {
          setAuthorsList(authorsRes.value.content || [])
        }
        if (genresRes.status === 'fulfilled') {
          setGenresList(genresRes.value.content || [])
        }
        if (erasRes.status === 'fulfilled') {
          setErasList(erasRes.value || [])
        }
      } catch (err) {
        console.error('Lỗi nạp danh sách sở thích', err)
      } finally {
        setLoadingOptions(false)
      }
    }
    loadOptions()
  }, [])

  // Fetch recommendations based on preferences
  const fetchRecommendations = useCallback(async (customPrefs?: UserPreferences) => {
    const activePrefs = customPrefs || preferences
    setLoadingRecommendations(true)
    try {
      const poems = await poemService.getRandomPoems({
        authorIds: activePrefs.authorIds,
        genreIds: activePrefs.genreIds,
        eras: activePrefs.eras,
      })
      setRecommendedPoems(poems || [])
    } catch (err) {
      console.error('Lỗi gợi ý bài thơ', err)
    } finally {
      setLoadingRecommendations(false)
    }
  }, [preferences])

  // Load recommendations on mount and when preferences change
  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  // Handlers for Authors
  const handleAddAuthor = (authorId: number) => {
    if (preferences.authorIds.includes(authorId)) return
    if (preferences.authorIds.length >= MAX_PER_CATEGORY) {
      toast(`Bạn chỉ có thể chọn tối đa ${MAX_PER_CATEGORY} tác giả yêu thích.`)
      return
    }
    setPreferences((prev) => ({
      ...prev,
      authorIds: [...prev.authorIds, authorId],
    }))
    setAuthorSearch('')
    setAuthorDropdownOpen(false)
  }

  const handleRemoveAuthor = (authorId: number) => {
    setPreferences((prev) => ({
      ...prev,
      authorIds: prev.authorIds.filter((id) => id !== authorId),
    }))
  }

  // Handlers for Genres
  const handleToggleGenre = (genreId: number) => {
    if (preferences.genreIds.includes(genreId)) {
      setPreferences((prev) => ({
        ...prev,
        genreIds: prev.genreIds.filter((id) => id !== genreId),
      }))
    } else {
      if (preferences.genreIds.length >= MAX_PER_CATEGORY) {
        toast(`Bạn chỉ có thể chọn tối đa ${MAX_PER_CATEGORY} thể loại yêu thích.`)
        return
      }
      setPreferences((prev) => ({
        ...prev,
        genreIds: [...prev.genreIds, genreId],
      }))
    }
  }

  // Handlers for Eras
  const handleToggleEra = (era: string) => {
    if (preferences.eras.includes(era)) {
      setPreferences((prev) => ({
        ...prev,
        eras: prev.eras.filter((e) => e !== era),
      }))
    } else {
      if (preferences.eras.length >= MAX_PER_CATEGORY) {
        toast(`Bạn chỉ có thể chọn tối đa ${MAX_PER_CATEGORY} kỷ nguyên yêu thích.`)
        return
      }
      setPreferences((prev) => ({
        ...prev,
        eras: [...prev.eras, era],
      }))
    }
  }

  // Save Preferences
  const handleSavePreferences = () => {
    setSavingPreferences(true)
    try {
      saveUserPreferences(userId, preferences)
      toast('Đã lưu sở thích cá nhân thành công!')
      fetchRecommendations(preferences)
    } finally {
      setSavingPreferences(false)
    }
  }

  // Reset Preferences
  const handleResetPreferences = () => {
    const cleared: UserPreferences = { authorIds: [], genreIds: [], eras: [] }
    setPreferences(cleared)
    saveUserPreferences(userId, cleared)
    toast('Đã đặt lại sở thích mặc định.')
    fetchRecommendations(cleared)
  }

  // Filter authors for search dropdown
  const filteredAuthors = authorsList.filter((a) =>
    a.name.toLowerCase().includes(authorSearch.toLowerCase().trim())
  )

  const selectedAuthors = authorsList.filter((a) => preferences.authorIds.includes(a.id))

  const hasAnyPreference =
    preferences.authorIds.length > 0 ||
    preferences.genreIds.length > 0 ||
    preferences.eras.length > 0

  return (
    <section className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
        <div>
          <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-amber-100 flex items-center gap-2">
            <span>✨</span> Cá Nhân Hóa Sở Thích Đọc Thơ
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Chọn tối đa 3 tác giả, 3 thể loại và 3 kỷ nguyên bạn yêu thích nhất để nhận gợi ý bài thơ ngẫu nhiên phù hợp.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {hasAnyPreference && (
            <button
              type="button"
              onClick={handleResetPreferences}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 font-medium transition-colors"
            >
              Đặt lại
            </button>
          )}
          <button
            type="button"
            onClick={handleSavePreferences}
            disabled={savingPreferences}
            className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-medium text-xs rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            {savingPreferences ? 'Đang lưu...' : 'Lưu sở thích'}
          </button>
        </div>
      </div>

      {loadingOptions ? (
        <div className="py-6 text-center text-xs text-slate-400">
          <span className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin inline-block mr-2" />
          Đang tải dữ liệu tác giả, thể loại, kỷ nguyên...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Category 1: Tác giả */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                1. Tác giả yêu thích ({preferences.authorIds.length}/{MAX_PER_CATEGORY})
              </label>
              {preferences.authorIds.length >= MAX_PER_CATEGORY && (
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  (Đã chọn đủ {MAX_PER_CATEGORY} tác giả)
                </span>
              )}
            </div>

            {/* Selected Authors Badges */}
            <div className="flex flex-wrap gap-2 min-h-[32px] items-center">
              {selectedAuthors.length === 0 ? (
                <span className="text-xs text-slate-400 italic">Chưa chọn tác giả nào.</span>
              ) : (
                selectedAuthors.map((author) => (
                  <span
                    key={author.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 text-xs font-semibold border border-amber-300 dark:border-amber-700"
                  >
                    <span>🖋️</span>
                    <span>{author.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAuthor(author.id)}
                      className="w-4 h-4 rounded-full bg-amber-200 dark:bg-amber-800 hover:bg-rose-500 hover:text-white flex items-center justify-center text-[10px] transition-colors"
                      title="Xóa tác giả"
                    >
                      ✕
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Author Search / Selector */}
            {preferences.authorIds.length < MAX_PER_CATEGORY && (
              <div className="relative max-w-sm mt-1.5">
                <input
                  type="text"
                  placeholder="Tìm kiếm tác giả để thêm..."
                  value={authorSearch}
                  onChange={(e) => {
                    setAuthorSearch(e.target.value)
                    setAuthorDropdownOpen(true)
                  }}
                  onFocus={() => setAuthorDropdownOpen(true)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />

                {authorDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setAuthorDropdownOpen(false)}
                    />
                    <div className="absolute left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-20 py-1 divide-y divide-slate-100 dark:divide-slate-700">
                      {filteredAuthors
                        .filter((a) => !preferences.authorIds.includes(a.id))
                        .slice(0, 15)
                        .map((author) => (
                          <button
                            key={author.id}
                            type="button"
                            onClick={() => handleAddAuthor(author.id)}
                            className="w-full text-left px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-700/80 transition-colors flex items-center justify-between"
                          >
                            <span className="font-medium">{author.name}</span>
                            {author.hometown && (
                              <span className="text-[10px] text-slate-400">{author.hometown}</span>
                            )}
                          </button>
                        ))}
                      {filteredAuthors.filter((a) => !preferences.authorIds.includes(a.id)).length === 0 && (
                        <div className="px-3 py-2 text-[11px] text-slate-400 text-center">
                          Không tìm thấy tác giả phù hợp
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Category 2: Thể loại */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                2. Thể loại thơ ({preferences.genreIds.length}/{MAX_PER_CATEGORY})
              </label>
              {preferences.genreIds.length >= MAX_PER_CATEGORY && (
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  (Đã chọn đủ {MAX_PER_CATEGORY} thể loại)
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {genresList.map((genre) => {
                const isSelected = preferences.genreIds.includes(genre.id)
                return (
                  <button
                    key={genre.id}
                    type="button"
                    onClick={() => handleToggleGenre(genre.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-amber-700 text-white shadow-sm ring-2 ring-amber-500/40'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-amber-400'
                    }`}
                  >
                    {isSelected && <span className="mr-1">✓</span>}
                    {genre.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Category 3: Kỷ nguyên / Thời kỳ */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                3. Kỷ nguyên / Thời kỳ ({preferences.eras.length}/{MAX_PER_CATEGORY})
              </label>
              {preferences.eras.length >= MAX_PER_CATEGORY && (
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  (Đã chọn đủ {MAX_PER_CATEGORY} kỷ nguyên)
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {erasList.map((era) => {
                const isSelected = preferences.eras.includes(era)
                return (
                  <button
                    key={era}
                    type="button"
                    onClick={() => handleToggleEra(era)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-amber-700 text-white shadow-sm ring-2 ring-amber-500/40'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-amber-400'
                    }`}
                  >
                    {isSelected && <span className="mr-1">✓</span>}
                    {era}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Recommended Random Poems Section */}
      <div className="pt-6 border-t border-slate-100 dark:border-slate-700 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-serif font-bold text-slate-900 dark:text-amber-100 flex items-center gap-2">
              <span>🎲</span> Gợi ý ngẫu nhiên theo sở thích của bạn
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {hasAnyPreference
                ? 'Các bài thơ được lựa chọn ngẫu nhiên từ tác giả, thể loại và kỷ nguyên bạn yêu thích.'
                : 'Hãy chọn sở thích phía trên để nhận gợi ý ngẫu nhiên được cá nhân hóa.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchRecommendations()}
            disabled={loadingRecommendations}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-amber-800 dark:text-amber-300 text-xs font-semibold transition-colors disabled:opacity-50"
            title="Lấy danh sách ngẫu nhiên mới"
          >
            <span className={loadingRecommendations ? 'animate-spin inline-block' : ''}>🎲</span>
            <span>{loadingRecommendations ? 'Đang tải...' : 'Đổi gợi ý'}</span>
          </button>
        </div>

        {loadingRecommendations ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 animate-pulse space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded w-full" />
              </div>
            ))}
          </div>
        ) : recommendedPoems.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-center space-y-2">
            <p className="text-sm font-serif italic text-slate-500 dark:text-slate-400">
              Không tìm thấy bài thơ nào khớp chính xác với tất cả tiêu chí sở thích đã chọn.
            </p>
            <p className="text-xs text-slate-400">
              Thử bấm <strong className="text-amber-700 dark:text-amber-400">"Đổi gợi ý"</strong> hoặc thêm bớt tác giả, thể loại khác!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedPoems.slice(0, 6).map((poem) => (
              <Link
                key={poem.id}
                to={toPoemSlug(poem)}
                className="group p-5 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-600 transition-all space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-serif font-bold text-slate-900 dark:text-amber-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                      {poemDisplayTitle(poem)}
                    </h4>
                    {poem.era && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex-shrink-0">
                        {poem.era}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-amber-800 dark:text-amber-400 font-semibold">
                    {poemAuthorName(poem)}
                    {poemGenreName(poem) && (
                      <span className="text-slate-400 font-normal"> · {poemGenreName(poem)}</span>
                    )}
                  </p>

                  <p className="text-xs font-serif italic text-slate-600 dark:text-slate-300 line-clamp-2 pt-1">
                    {poem.content?.split('\n').filter(Boolean)[0] || '...'}
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <span className="text-xs text-amber-700 dark:text-amber-400 font-medium group-hover:underline flex items-center gap-1">
                    Đọc toàn bài →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
