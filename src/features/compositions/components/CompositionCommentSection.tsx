import { useState, useEffect } from 'react'
import type { CommentResponse, ReplyResponse } from '@/types'
import { commentService } from '@/services/comment.service'
import { replyService } from '@/services/reply.service'
import { useToast } from '@/contexts/ToastContext'
import { getErrorMessage } from '@/utils/error'
import { CommentForm } from '@/features/comments/components/CommentForm'
import { CommentItem } from '@/features/comments/components/CommentItem'
import { Skeleton } from '@/components/ui/Skeleton'

interface CompositionCommentSectionProps {
  compositionId: number
}

export function CompositionCommentSection({ compositionId }: CompositionCommentSectionProps) {
  const { toast } = useToast()

  const [comments, setComments] = useState<CommentResponse[]>([])
  const [repliesMap, setRepliesMap] = useState<Record<number, ReplyResponse[]>>({})
  const [nextCursor, setNextCursor] = useState<number | null>(null)
  const [hasNext, setHasNext] = useState(false)
  const [totalComments, setTotalComments] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    async function loadComments() {
      if (!compositionId) return
      setLoading(true)
      try {
        const commentData = await commentService.getCommentsByComposition(compositionId, { size: 10 })
        const commentList = commentData.content || []
        setComments(commentList)
        setNextCursor(commentData.next_cursor ?? commentData.nextCursor ?? null)
        setHasNext(Boolean(commentData.has_next ?? commentData.hasNext))
        const total = commentData.total_elements ?? commentData.totalElements
        setTotalComments(total !== null && total !== undefined ? total : commentList.length)

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
        console.error('Lỗi khi nạp bình luận bài thơ sáng tác:', err)
      } finally {
        setLoading(false)
      }
    }
    loadComments()
  }, [compositionId])

  const handleLoadMore = async () => {
    if (!compositionId || nextCursor === null || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await commentService.getCommentsByComposition(compositionId, {
        cursor: nextCursor,
        size: 10,
      })
      const newComments = res.content || []
      setComments((prev) => [...prev, ...newComments])
      setNextCursor(res.next_cursor ?? res.nextCursor ?? null)
      setHasNext(Boolean(res.has_next ?? res.hasNext))

      if (newComments.length > 0) {
        const map: Record<number, ReplyResponse[]> = {}
        const replyPromises = newComments.map(async (c) => {
          try {
            const reps = await replyService.getRepliesByComment(c.id)
            map[c.id] = reps || []
          } catch {
            map[c.id] = []
          }
        })
        await Promise.all(replyPromises)
        setRepliesMap((prev) => ({ ...prev, ...map }))
      }
    } catch (err) {
      toast(`Không thể tải thêm bình luận: ${getErrorMessage(err)}`)
    } finally {
      setLoadingMore(false)
    }
  }

  const handleCreateComment = async (content: string) => {
    if (!compositionId) return
    try {
      const newComment = await commentService.createComment({
        poemCompositionId: compositionId,
        content,
      })
      setComments((prev) => [newComment, ...prev])
      setTotalComments((prev) => (prev !== null ? prev + 1 : 1))
      toast('Đã đăng bình luận thành công!')
    } catch (err) {
      toast(getErrorMessage(err))
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    try {
      await commentService.deleteComment(commentId)
      setComments((prev) => prev.filter((c) => c.id !== commentId))
      setTotalComments((prev) => (prev !== null ? Math.max(0, prev - 1) : 0))
      toast('Đã xóa bình luận.')
    } catch (err) {
      toast(getErrorMessage(err))
    }
  }

  const handleUpdateComment = async (commentId: number, content: string) => {
    try {
      const updated = await commentService.updateComment(commentId, content)
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, content: updated.content } : c))
      )
      toast('Đã cập nhật bình luận.')
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
      toast('Đã gửi câu trả lời!')
    } catch (err) {
      toast(getErrorMessage(err))
    }
  }

  return (
    <section className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span>Bình luận & Cảm nhận</span>
          {totalComments !== null && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-sans font-medium">
              {totalComments}
            </span>
          )}
        </h3>
      </div>

      {/* Comment Form */}
      <div className="mb-8">
        <CommentForm onSubmit={handleCreateComment} />
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-10 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Chưa có bình luận nào cho bài thơ này. Hãy là người đầu tiên chia sẻ cảm xúc của bạn!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={repliesMap[comment.id] || []}
              onDelete={handleDeleteComment}
              onUpdate={handleUpdateComment}
              onAddReply={handleAddReply}
            />
          ))}

          {hasNext && (
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Đang tải thêm bình luận...' : 'Xem thêm bình luận cũ hơn'}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
