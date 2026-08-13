import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom'
import { poemService } from '@/services/poem.service'
import { commentService } from '@/services/comment.service'
import { replyService } from '@/services/reply.service'
import { useReaderMode } from '@/contexts/ReaderModeContext'
import { useToast } from '@/contexts/ToastContext'
import type { PoemResponse, CommentResponse, ReplyResponse } from '@/types'
import { PATHS, poemIdFromSlug, toPoemSlug } from '@/routes/paths'
import { Skeleton } from '@/components/ui/Skeleton'
import { CommentForm } from '@/features/comments/components/CommentForm'
import { CommentItem } from '@/features/comments/components/CommentItem'
import { FeedbackForm } from '@/features/feedbacks/components/FeedbackForm'
import { getErrorMessage } from '@/utils/error'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { poemDisplayTitle, poemAuthorName, poemGenreName } from '@/features/poems/display'
import { languageLabel } from '@/features/browse/labels'
import { Seo } from '@/components/common/Seo'

// Cài đặt đọc: cỡ chữ và giãn dòng, lưu ở localStorage.
const FONT_STEPS = ['text-base md:text-lg', 'text-lg md:text-xl', 'text-xl md:text-2xl', 'text-2xl md:text-3xl']
const LEADING_STEPS = ['leading-relaxed', 'leading-loose', 'leading-[2.4]']

export default function PoemDetailPage() {
  // Đến từ route slug `/:slug` hoặc route cũ `/poems/:id`.
  const { id, slug } = useParams<{ id?: string; slug?: string }>()
  const poemId = id ? Number(id) : slug ? poemIdFromSlug(slug) : null

  const location = useLocation()
  const navigate = useNavigate()
  const { mode, toggleMode } = useReaderMode()
  const { toast } = useToast()

  const [poem, setPoem] = useState<PoemResponse | null>(null)
  const [comments, setComments] = useState<CommentResponse[]>([])
  const [repliesMap, setRepliesMap] = useState<Record<number, ReplyResponse[]>>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'content' | 'transliteration' | 'meaning'>('content')
  const [fontIdx, setFontIdx] = useLocalStorage('poems_reader_font', 1)
  const [leadingIdx, setLeadingIdx] = useLocalStorage('poems_reader_leading', 1)
  const [copied, setCopied] = useState<'' | 'poem' | 'link'>('')

  const copyToClipboard = (text: string, kind: 'poem' | 'link') => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(kind)
      setTimeout(() => setCopied(''), 1500)
    })
  }

  useEffect(() => {
    async function loadPoemAndComments() {
      if (!poemId) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const [poemData, commentData] = await Promise.all([
          poemService.getPoemById(poemId),
          commentService.getCommentsByPoem(poemId, { page: 0, size: 50 }),
        ])
        setPoem(poemData)
        const commentList = commentData.content || []
        setComments(commentList)

        if (commentList.length > 0) {
          const map: Record<number, ReplyResponse[]> = {}
          const replyPromises = commentList.map(async (c) => {
            try {
              const reps = await replyService.getRepliesByComment(c.id)
              map[c.id] = reps || []
            } catch {
              map[c.id] = []
            }
          })
          await Promise.all(replyPromises)
          setRepliesMap(map)
        }
      } catch (err) {
        console.error('Lỗi nạp bài thơ', err)
      } finally {
        setLoading(false)
      }
    }
    loadPoemAndComments()
  }, [poemId])

  // Chuẩn hoá URL: nếu vào bằng /poems/:id hoặc slug cũ/sai, thay bằng slug chuẩn.
  useEffect(() => {
    if (!poem) return
    const canonical = toPoemSlug(poem)
    if (location.pathname !== canonical) {
      navigate(canonical, { replace: true })
    }
  }, [poem, location.pathname, navigate])

  const handleCreateComment = async (content: string) => {
    if (!poemId) return
    try {
      const newComment = await commentService.createComment({ poemId, content })
      setComments((prev) => [newComment, ...prev])
    } catch (err) {
      toast(getErrorMessage(err))
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    try {
      await commentService.deleteComment(commentId)
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    } catch (err) {
      toast(getErrorMessage(err))
    }
  }

  const handleUpdateComment = async (commentId: number, content: string) => {
    try {
      const updated = await commentService.updateComment(commentId, content)
      setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, content: updated.content } : c)))
    } catch (err) {
      toast(getErrorMessage(err))
    }
  }

  const handleAddReply = async (commentId: number, content: string) => {
    try {
      const newReply = await replyService.createReply({ commentId, content })
      setRepliesMap((prev) => ({
        ...prev,
        [commentId]: [...(prev[commentId] || []), newReply],
      }))
    } catch (err) {
      toast(getErrorMessage(err))
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 space-y-6">
        <Skeleton className="h-10 w-3/4 rounded-xl" />
        <Skeleton className="h-6 w-1/3 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!poem) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100 mb-2">
          Không tìm thấy bài thơ này
        </h2>
        <Link to={PATHS.POEMS} className="text-amber-600 hover:underline">
          ← Quay lại kho thơ
        </Link>
      </div>
    )
  }

  const seoTitle = `${poemDisplayTitle(poem)} – ${poemAuthorName(poem)}`
  const seoDescription = poem.content
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(' / ')
    .slice(0, 160)

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-10">
      <Seo title={seoTitle} description={seoDescription} path={toPoemSlug(poem)} ogType="article" />
      {/* Structured data cho Google Rich Results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Poem',
            name: poemDisplayTitle(poem),
            author: { '@type': 'Person', name: poemAuthorName(poem) },
            genre: poemGenreName(poem),
            inLanguage: poem.language || 'vi',
            url: `${window.location.origin}${toPoemSlug(poem)}`,
          }),
        }}
      />
      {/* Top Toolbar */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/60 pb-4">
        <Link
          to={PATHS.POEMS}
          className="text-sm text-slate-500 hover:text-amber-700 dark:hover:text-amber-400 font-medium flex items-center gap-1 transition-colors"
        >
          ← Trở về danh sách
        </Link>

        {/* Cài đặt đọc */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400 hidden sm:inline mr-0.5">Cỡ chữ</span>
            <button
              onClick={() => setFontIdx(Math.max(0, fontIdx - 1))}
              disabled={fontIdx === 0}
              aria-label="Giảm cỡ chữ"
              className="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              A−
            </button>
            <button
              onClick={() => setFontIdx(Math.min(FONT_STEPS.length - 1, fontIdx + 1))}
              disabled={fontIdx === FONT_STEPS.length - 1}
              aria-label="Tăng cỡ chữ"
              className="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              A+
            </button>
          </div>
          <button
            onClick={() => setLeadingIdx((leadingIdx + 1) % LEADING_STEPS.length)}
            aria-label="Đổi giãn dòng"
            className="px-2.5 h-7 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Giãn dòng
          </button>
          <button
            onClick={toggleMode}
            className="px-3 h-7 rounded-md bg-amber-100 dark:bg-slate-800 text-amber-900 dark:text-amber-200 text-xs font-medium hover:bg-amber-200 dark:hover:bg-slate-700 transition-colors border border-amber-200 dark:border-slate-700"
          >
            {mode === 'classic-sepia' ? 'Cổ điển' : mode === 'modern-light' ? 'Sáng' : 'Tối'}
          </button>
        </div>
      </div>

      {/* Main Poem Display Card */}
      <div className="poem-container p-8 md:p-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-colors">
        {/* Header */}
        <div className="text-left space-y-3 mb-8 pb-6 border-b border-amber-900/10 dark:border-slate-700/50">
          {/* Chỉ mục phân cấp: Ngôn ngữ › Thời kỳ › Thể loại */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            {[
              poem.language ? languageLabel(poem.language) : null,
              poem.era || null,
              poem.genreName || poem.genre_name || null,
            ]
              .filter(Boolean)
              .map((label, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-slate-300 dark:text-slate-600">›</span>}
                  <span className={i === 0 ? 'font-semibold text-amber-800 dark:text-amber-300' : 'font-medium'}>
                    {label}
                  </span>
                </span>
              ))}
            {poem.year && <span className="ml-1 font-mono text-slate-400">· Sáng tác năm {poem.year}</span>}
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 dark:text-amber-100 tracking-tight">
            {poemDisplayTitle(poem)}
          </h1>
          <p className="text-base">
            <span className="text-slate-500 dark:text-slate-400">Tác giả: </span>
            <span className="font-semibold text-amber-800/90 dark:text-amber-400">{poemAuthorName(poem)}</span>
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() =>
                copyToClipboard(
                  `${poemDisplayTitle(poem)}\n${poemAuthorName(poem)}\n\n${poem.content}`,
                  'poem',
                )
              }
              className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {copied === 'poem' ? 'Đã sao chép' : 'Sao chép bài thơ'}
            </button>
            <button
              onClick={() => copyToClipboard(window.location.href, 'link')}
              className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {copied === 'link' ? 'Đã chép liên kết' : 'Chia sẻ'}
            </button>
          </div>
        </div>

        {/* Tabs: Nguyên tác / Phiên âm / Dịch nghĩa (chỉ hiện khi có phần tương ứng) */}
        {(poem.transliteration || poem.meaning) && (
          <div className="flex flex-wrap justify-start gap-2 mb-8">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'content'
                  ? 'bg-amber-700 text-white'
                  : 'bg-amber-100/50 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              Nguyên tác
            </button>
            {poem.transliteration && (
              <button
                onClick={() => setActiveTab('transliteration')}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'transliteration'
                    ? 'bg-amber-700 text-white'
                    : 'bg-amber-100/50 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                Phiên âm Hán Việt
              </button>
            )}
            {poem.meaning && (
              <button
                onClick={() => setActiveTab('meaning')}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'meaning'
                    ? 'bg-amber-700 text-white'
                    : 'bg-amber-100/50 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                Dịch nghĩa
              </button>
            )}
          </div>
        )}

        {/* Content Body — căn trái trong khổ hẹp, giữ nguyên hình khổ thơ */}
        <div
          className={`max-w-[36rem] text-left font-serif tracking-wide whitespace-pre-line my-6 text-slate-800 dark:text-slate-100 ${FONT_STEPS[fontIdx]} ${LEADING_STEPS[leadingIdx]}`}
        >
          {activeTab === 'content' && poem.content}
          {activeTab === 'transliteration' && poem.transliteration}
          {activeTab === 'meaning' && poem.meaning}
        </div>

        {poem.description && (
          <div className="mt-10 p-4 rounded-xl bg-amber-500/5 dark:bg-slate-900/40 border border-amber-500/10 text-xs italic text-slate-600 dark:text-slate-400">
            <strong>Ghi chú:</strong> {poem.description}
          </div>
        )}
      </div>

      {/* Các bản dịch thơ */}
      {poem.translations && poem.translations.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-amber-100">
            Bản dịch ({poem.translations.length})
          </h3>
          <div className="space-y-4">
            {poem.translations.map((t, idx) => (
              <div
                key={idx}
                className="p-5 md:p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm"
              >
                {t.translator && (
                  <p className="mb-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                    Bản dịch của {t.translator}
                  </p>
                )}
                <div className="font-serif whitespace-pre-line leading-loose text-slate-800 dark:text-slate-100">
                  {t.content}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Comments Section */}
      <section className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl border border-slate-200 dark:border-slate-700 space-y-6">
        <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-amber-100">
          Bình luận ({comments.length})
        </h3>

        <CommentForm onSubmit={handleCreateComment} />

        <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-700/60">
          {comments.length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-400 italic">
              Chưa có bình luận nào. Hãy là người đầu tiên để lại cảm nhận!
            </p>
          ) : (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                replies={repliesMap[comment.id] || []}
                onDelete={handleDeleteComment}
                onUpdate={handleUpdateComment}
                onAddReply={handleAddReply}
              />
            ))
          )}
        </div>
      </section>

      {/* Feedback Form Component */}
      <FeedbackForm poemId={poem.id} />
    </div>
  )
}
