import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { storyService } from '@/services/story.service'
import { PATHS, toAuthorDetail, toStorySlug, storyIdFromSlug } from '@/routes/paths'
import type { StoryResponse, StoryChapterResponse } from '@/types'

const FONT_STEPS = [16, 18, 20, 22, 24]

function posKey(id: number) {
  return `story_read_pos_${id}`
}

export default function StoryDetailPage() {
  const { id: idParam, slug } = useParams()
  // Vào bằng /stories/:id hoặc slug gốc /tieu-de-tac-gia-<mã>.
  const id = idParam ? Number(idParam) : (storyIdFromSlug(slug || '') ?? NaN)
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const [story, setStory] = useState<StoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [chapter, setChapter] = useState<StoryChapterResponse | null>(null)
  const [loadingChapter, setLoadingChapter] = useState(false)

  const [fontIdx, setFontIdx] = useState(() => {
    const v = parseInt(localStorage.getItem('story_font_idx') || '1', 10)
    return Number.isFinite(v) && v >= 0 && v < FONT_STEPS.length ? v : 1
  })
  const contentRef = useRef<HTMLDivElement>(null)
  const scrollBoxRef = useRef<HTMLDivElement>(null)

  const chapters = story?.chapters || []
  const isMulti = chapters.length > 1

  // seq hiện tại: ưu tiên URL ?chapter=, rồi localStorage, mặc định 1.
  const seq = useMemo(() => {
    const fromUrl = parseInt(searchParams.get('chapter') || '', 10)
    if (Number.isFinite(fromUrl) && fromUrl > 0) return fromUrl
    if (!Number.isNaN(id)) {
      const saved = parseInt(localStorage.getItem(posKey(id)) || '', 10)
      if (Number.isFinite(saved) && saved > 0) return saved
    }
    return 1
  }, [searchParams, id])

  // Nạp metadata + mục lục.
  useEffect(() => {
    if (Number.isNaN(id)) {
      setNotFound(true)
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    storyService
      .getStory(id)
      .then((s) => alive && setStory(s))
      .catch(() => alive && setNotFound(true))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [id])

  // Vào bằng /stories/:id → chuyển sang slug đẹp ở gốc (giữ nguyên ?chapter=).
  useEffect(() => {
    if (idParam && story) {
      navigate(toStorySlug({ id: story.id, title: story.title, author: story.author }) + window.location.search, { replace: true })
    }
  }, [idParam, story, navigate])

  // Nạp nội dung chương theo seq.
  useEffect(() => {
    if (Number.isNaN(id) || !story) return
    let alive = true
    setLoadingChapter(true)
    storyService
      .getChapter(id, seq)
      .then((c) => {
        if (!alive) return
        setChapter(c)
        localStorage.setItem(posKey(id), String(seq))
      })
      .catch(() => alive && setChapter(null))
      .finally(() => alive && setLoadingChapter(false))
    return () => {
      alive = false
    }
  }, [id, seq, story])

  const goChapter = (nextSeq: number) => {
    const next = new URLSearchParams(searchParams)
    if (nextSeq <= 1) next.delete('chapter')
    else next.set('chapter', String(nextSeq))
    setSearchParams(next)
    // Cuộn khung nội dung về đầu (desktop) + đưa khung vào tầm nhìn (mobile).
    scrollBoxRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const changeFont = (delta: number) => {
    setFontIdx((i) => {
      const next = Math.min(Math.max(i + delta, 0), FONT_STEPS.length - 1)
      localStorage.setItem('story_font_idx', String(next))
      return next
    })
  }

  if (loading) return <p className="text-center text-slate-400 py-20">Đang tải…</p>
  if (notFound || !story)
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-500 mb-4">Không tìm thấy tác phẩm.</p>
        <Link to={PATHS.STORIES} className="text-amber-700 dark:text-amber-400 hover:underline">
          ← Về Truyện ngắn
        </Link>
      </div>
    )

  const hasPrev = seq > 1
  const hasNext = seq < chapters.length
  const curMeta = chapters.find((c) => c.seq === seq)

  const chapterNav = isMulti ? (
    <div className="flex items-center justify-between gap-2">
      <button
        disabled={!hasPrev}
        onClick={() => goChapter(seq - 1)}
        className="px-3 py-1.5 text-sm rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:border-amber-300 dark:hover:border-amber-700 text-slate-700 dark:text-slate-200"
      >
        ‹ Chương trước
      </button>
      <span className="text-xs text-slate-400">
        Chương {seq}/{chapters.length}
      </span>
      <button
        disabled={!hasNext}
        onClick={() => goChapter(seq + 1)}
        className="px-3 py-1.5 text-sm rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:border-amber-300 dark:hover:border-amber-700 text-slate-700 dark:text-slate-200"
      >
        Chương sau ›
      </button>
    </div>
  ) : null

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Link to={PATHS.STORIES} className="text-xs text-amber-700 dark:text-amber-400 hover:underline">
        ← Truyện ngắn
      </Link>

      {/* Header gọn: tiêu đề + 1 dòng meta; nút cỡ chữ cùng hàng bên phải. */}
      <div className="flex items-start justify-between gap-3 mt-1.5 mb-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-amber-100 leading-snug">
            {story.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
            {story.collection && (
              <span className="px-2 py-0.5 rounded-full font-semibold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                {story.collection}
              </span>
            )}
            {story.author &&
              (story.author_id ? (
                <Link to={toAuthorDetail(story.author_id)} className="font-medium text-amber-700 dark:text-amber-400 hover:underline">
                  {story.author}
                </Link>
              ) : (
                <span className="font-medium text-amber-700 dark:text-amber-400">{story.author}</span>
              ))}
            {story.year && <span>· {story.year}</span>}
            {isMulti && <span>· {chapters.length} chương</span>}
            {story.word_count ? <span>· {story.word_count.toLocaleString('vi-VN')} từ</span> : null}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => changeFont(-1)} className="w-7 h-7 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm" aria-label="Giảm cỡ chữ">A−</button>
          <button onClick={() => changeFont(1)} className="w-7 h-7 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm" aria-label="Tăng cỡ chữ">A+</button>
        </div>
      </div>

      <div className={isMulti ? 'grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 lg:items-start' : ''}>
        {isMulti && (
          <aside className="lg:sticky lg:top-24 self-start">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
              <p className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                Mục lục
              </p>
              <ul className="thin-scrollbar max-h-[calc(100vh-11rem)] overflow-y-auto">
                {chapters.map((c) => (
                  <li key={c.seq}>
                    <button
                      onClick={() => goChapter(c.seq)}
                      className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                        c.seq === seq
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 font-medium'
                          : 'text-slate-600 hover:bg-amber-50 dark:text-slate-300 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <span className="text-slate-400 mr-1.5">{c.seq}.</span>
                      {c.title || `Chương ${c.seq}`}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}

        {/* Khung nội dung: ghim cố định như mục lục, cuộn NỘI DUNG bên trong; tiêu đề + nút chương cố định. */}
        <div ref={contentRef} className="lg:sticky lg:top-24 self-start min-w-0">
          <article className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col lg:max-h-[calc(100vh-7rem)] overflow-hidden">
            {isMulti && curMeta && (
              <h2 className="flex-shrink-0 px-6 sm:px-8 pt-5 pb-3 border-b border-slate-100 dark:border-slate-700 text-xl font-serif font-bold text-slate-900 dark:text-amber-100">
                {curMeta.title || `Chương ${seq}`}
              </h2>
            )}
            <div ref={scrollBoxRef} className="thin-scrollbar flex-1 overflow-y-auto px-6 sm:px-8 py-6">
              {loadingChapter ? (
                <p className="text-center text-slate-400 py-10">Đang tải chương…</p>
              ) : chapter ? (
                <div
                  className="font-serif text-slate-800 dark:text-slate-200 whitespace-pre-line leading-loose max-w-prose mx-auto"
                  style={{ fontSize: FONT_STEPS[fontIdx] }}
                >
                  {chapter.content}
                </div>
              ) : (
                <p className="text-center text-slate-400 py-10">Chương này chưa có nội dung.</p>
              )}
            </div>
            {isMulti && (
              <div className="flex-shrink-0 border-t border-slate-100 dark:border-slate-700 px-4 py-2.5">
                {chapterNav}
              </div>
            )}
          </article>
        </div>
      </div>
    </div>
  )
}
