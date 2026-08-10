import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { poemService } from '@/services/poem.service'
import { commentService } from '@/services/comment.service'
import { replyService } from '@/services/reply.service'
import { useReaderMode } from '@/contexts/ReaderModeContext'
import type { PoemResponse, CommentResponse, ReplyResponse } from '@/types'
import { PATHS } from '@/routes/paths'
import { Skeleton } from '@/components/ui/Skeleton'
import { CommentForm } from '@/features/comments/components/CommentForm'
import { CommentItem } from '@/features/comments/components/CommentItem'
import { FeedbackForm } from '@/features/feedbacks/components/FeedbackForm'
import { getErrorMessage } from '@/utils/error'

export default function PoemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const poemId = Number(id)

  const { mode, toggleMode } = useReaderMode()

  const [poem, setPoem] = useState<PoemResponse | null>(null)
  const [comments, setComments] = useState<CommentResponse[]>([])
  const [repliesMap, setRepliesMap] = useState<Record<number, ReplyResponse[]>>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'content' | 'transliteration' | 'translation'>('content')

  useEffect(() => {
    async function loadPoemAndComments() {
      if (!poemId) return
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

  const handleCreateComment = async (content: string) => {
    try {
      const newComment = await commentService.createComment({ poemId, content })
      setComments((prev) => [newComment, ...prev])
    } catch (err) {
      alert(getErrorMessage(err))
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    try {
      await commentService.deleteComment(commentId)
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    } catch (err) {
      alert(getErrorMessage(err))
    }
  }

  const handleUpdateComment = async (commentId: number, content: string) => {
    try {
      const updated = await commentService.updateComment(commentId, content)
      setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, content: updated.content } : c)))
    } catch (err) {
      alert(getErrorMessage(err))
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
      alert(getErrorMessage(err))
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 space-y-6">
        <Skeleton className="h-10 w-3/4 rounded-xl" />
        <Skeleton className="h-6 w-1/3 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
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

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-10">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/60 pb-4">
        <Link
          to={PATHS.POEMS}
          className="text-sm text-slate-500 hover:text-amber-700 dark:hover:text-amber-400 font-medium flex items-center gap-1 transition"
        >
          ← Trở về Danh Sách
        </Link>

        {/* Reader Mode Controller */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">Chế độ đọc:</span>
          <button
            onClick={toggleMode}
            className="px-3 py-1.5 rounded-xl bg-amber-100/80 dark:bg-slate-800 text-amber-950 dark:text-amber-200 text-xs font-semibold hover:bg-amber-200 transition shadow-sm border border-amber-500/20"
          >
            {mode === 'classic-sepia' ? '📜 Style Cổ Điển (Sepia)' : '⚡ Style Hiện Đại'}
          </button>
        </div>
      </div>

      {/* Main Poem Display Card */}
      <div className="poem-container p-8 md:p-12 rounded-3xl transition-all duration-300">
        {/* Header */}
        <div className="text-center space-y-3 mb-8 pb-6 border-b border-amber-900/10 dark:border-slate-700/50">
          <div className="inline-flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-600/10 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              {poem.genreName || 'Thơ ca'}
            </span>
            {poem.year && (
              <span className="text-xs text-slate-400 font-mono">Sáng tác năm {poem.year}</span>
            )}
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 dark:text-amber-100 tracking-tight">
            {poem.name}
          </h1>
          <p className="text-base font-medium text-amber-800/80 dark:text-amber-400">
            Tác giả: <strong>{poem.authorName || 'Vô danh'}</strong>
          </p>
        </div>

        {/* Tabs for Transliteration / Translation if available */}
        {(poem.transliteration || poem.translation) && (
          <div className="flex justify-center gap-2 mb-8">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'content'
                  ? 'bg-amber-700 text-white shadow'
                  : 'bg-amber-100/50 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              Nguyên Tác
            </button>
            {poem.transliteration && (
              <button
                onClick={() => setActiveTab('transliteration')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'transliteration'
                    ? 'bg-amber-700 text-white shadow'
                    : 'bg-amber-100/50 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                Phiên Âm Hán Việt
              </button>
            )}
            {poem.translation && (
              <button
                onClick={() => setActiveTab('translation')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'translation'
                    ? 'bg-amber-700 text-white shadow'
                    : 'bg-amber-100/50 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                Dịch Thơ
              </button>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="text-center font-serif text-lg md:text-xl leading-loose tracking-wide whitespace-pre-line my-6 text-slate-800 dark:text-slate-100">
          {activeTab === 'content' && poem.content}
          {activeTab === 'transliteration' && poem.transliteration}
          {activeTab === 'translation' && poem.translation}
        </div>

        {poem.description && (
          <div className="mt-10 p-4 rounded-xl bg-amber-500/5 dark:bg-slate-900/40 border border-amber-500/10 text-xs italic text-slate-600 dark:text-slate-400">
            <strong>Ghi chú:</strong> {poem.description}
          </div>
        )}
      </div>

      {/* Feedback Form Component */}
      <FeedbackForm poemId={poemId} />

      {/* Comments Section */}
      <section className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
        <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-amber-100 flex items-center gap-2">
          💬 Bình Luận Độc Giả ({comments.length})
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
    </div>
  )
}
