import { useState } from 'react'
import type { CommentResponse, ReplyResponse } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { useGuestCTAModal } from '@/contexts/GuestCTAModalContext'
import { ReplyItem } from './ReplyItem'
import { ReplyForm } from './ReplyForm'
import { formatRelativeTime } from '@/utils/format'
import { RichContent } from '@/components/common/RichContent'

interface CommentItemProps {
  comment: CommentResponse
  replies: ReplyResponse[]
  onDelete: (commentId: number) => Promise<void>
  onUpdate: (commentId: number, content: string) => Promise<void>
  onAddReply: (commentId: number, content: string) => Promise<void>
}

/**
 * Comment kiểu diễn đàn (pattern tu-vi-v1): avatar + bubble; sub comment gấp
 * gọn sau nút "▾ Xem N câu trả lời", có đường nối thread từ avatar gốc.
 */
export function CommentItem({
  comment,
  replies,
  onDelete,
  onUpdate,
  onAddReply,
}: CommentItemProps) {
  const { user, isAuthenticated } = useAuth()
  const { openModal } = useGuestCTAModal()

  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [showReplyForm, setShowReplyForm] = useState(false)
  /** Sub comment đang được trả lời (null = trả lời comment gốc) — form render ngay DƯỚI sub comment đó */
  const [replyTarget, setReplyTarget] = useState<{ replyId: number; username: string } | null>(null)
  const [expanded, setExpanded] = useState(false)

  const openReplyForm = (target: { replyId: number; username: string } | null) => {
    if (!isAuthenticated) {
      openModal('trả lời bình luận')
      return
    }
    setReplyTarget(target)
    setShowReplyForm(true)
  }

  const closeReplyForm = () => {
    setShowReplyForm(false)
    setReplyTarget(null)
  }

  const submitReply = async (cId: number, text: string) => {
    await onAddReply(cId, text)
    closeReplyForm()
    setExpanded(true)
  }

  const commentUserId = comment.userId ?? comment.user_id
  const isOwner =
    !!user && (user.id === commentUserId || user.username === comment.username)
  const createdAt = comment.createdAt ?? comment.created_at

  const handleUpdate = async () => {
    if (!editContent.trim()) return
    await onUpdate(comment.id, editContent.trim())
    setIsEditing(false)
  }

  const userAvatar = isOwner
    ? (user?.id ? localStorage.getItem(`user_avatar_${user.id}`) : null) ||
      (user?.username ? localStorage.getItem(`user_avatar_${user.username}`) : null) ||
      localStorage.getItem('user_avatar_current')
    : null

  return (
    <div className="poem-comment-thread">
      <div className="poem-comment">
        <div className="poem-comment-avatar">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={comment.username}
              className="w-9 h-9 rounded-full object-cover border border-amber-500 shadow-sm"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
              {comment.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Bubble */}
        <div className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-sm font-bold text-amber-800 dark:text-amber-300">
                {comment.username}
              </span>
              {createdAt && (
                <span className="text-xs text-slate-400 ml-2">
                  {formatRelativeTime(createdAt)}
                </span>
              )}
            </div>
            {isOwner && (
              <div className="flex items-center gap-2 text-xs flex-shrink-0">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-slate-400 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
                >
                  Sửa
                </button>
                <button
                  onClick={() => onDelete(comment.id)}
                  className="text-slate-400 hover:text-rose-500 transition-colors"
                >
                  Xóa
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md"
              />
              <button
                onClick={handleUpdate}
                className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-md"
              >
                Lưu
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-xs rounded-md"
              >
                Hủy
              </button>
            </div>
          ) : (
            <RichContent content={comment.content} className="mt-1" />
          )}

          {/* Action bar — footer với đường kẻ đứt như diễn đàn */}
          <div className="mt-2 pt-2 border-t border-dashed border-slate-200 dark:border-slate-700 flex items-center gap-3 text-xs">
            <button
              onClick={() => {
                if (showReplyForm && replyTarget === null) {
                  closeReplyForm()
                } else {
                  openReplyForm(null)
                }
              }}
              className="text-slate-500 dark:text-slate-400 font-semibold hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
            >
              Trả lời
            </button>
          </div>
        </div>
      </div>

      {/* Form trả lời comment gốc — nằm ngay dưới comment gốc */}
      {showReplyForm && replyTarget === null && (
        <div className="ml-11">
          <ReplyForm
            commentId={comment.id}
            replyingTo={comment.username}
            onCancel={closeReplyForm}
            onSubmit={submitReply}
          />
        </div>
      )}

      {/* Sub comments: gấp gọn sau nút Xem/Ẩn, có đường nối thread */}
      {replies.length > 0 && (
        <>
          <button
            type="button"
            className="poem-comment-expand"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '▴ Ẩn câu trả lời' : `▾ Xem ${replies.length} câu trả lời`}
          </button>
          {expanded && (
            <ul className="poem-comment-replies">
              {replies.map((reply) => (
                <li key={reply.id}>
                  <ReplyItem
                    reply={reply}
                    parentUsername={comment.username}
                    onReply={(username) => openReplyForm({ replyId: reply.id, username })}
                  />
                  {/* Form trả lời sub comment — ngay DƯỚI sub comment được trả lời */}
                  {showReplyForm && replyTarget?.replyId === reply.id && (
                    <div className="mt-2 ml-10">
                      <ReplyForm
                        commentId={comment.id}
                        replyingTo={replyTarget.username}
                        mention={replyTarget.username}
                        onCancel={closeReplyForm}
                        onSubmit={submitReply}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
