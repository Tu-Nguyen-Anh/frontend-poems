import { useState } from 'react'
import type { CommentResponse, ReplyResponse } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { useGuestCTAModal } from '@/contexts/GuestCTAModalContext'
import { ReplyItem } from './ReplyItem'
import { ReplyForm } from './ReplyForm'

interface CommentItemProps {
  comment: CommentResponse
  replies: ReplyResponse[]
  onDelete: (commentId: number) => Promise<void>
  onUpdate: (commentId: number, content: string) => Promise<void>
  onAddReply: (commentId: number, content: string) => Promise<void>
}

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

  const isOwner = user?.id === comment.userId || user?.username === comment.username

  const handleUpdate = async () => {
    if (!editContent.trim()) return
    await onUpdate(comment.id, editContent.trim())
    setIsEditing(false)
  }

  return (
    <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
            {comment.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {comment.username}
            </span>
            <span className="text-[10px] text-slate-400 ml-2">
              {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
            </span>
          </div>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2 text-xs">
            <button onClick={() => setIsEditing(!isEditing)} className="text-amber-600 hover:underline">
              Sửa
            </button>
            <button onClick={() => onDelete(comment.id)} className="text-rose-500 hover:underline">
              Xóa
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border rounded-xl"
          />
          <button onClick={handleUpdate} className="px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-xl">
            Lưu
          </button>
          <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-xs rounded-xl">
            Hủy
          </button>
        </div>
      ) : (
        <p className="text-sm text-slate-700 dark:text-slate-300 pl-10 whitespace-pre-line leading-relaxed">
          {comment.content}
        </p>
      )}

      {/* Action Bar for Reply */}
      <div className="pl-10 flex items-center gap-3 text-xs">
        <button
          onClick={() => {
            if (!isAuthenticated) {
              openModal('trả lời bình luận')
            } else {
              setShowReplyForm(!showReplyForm)
            }
          }}
          className="text-amber-700 dark:text-amber-400 font-semibold hover:underline"
        >
          ↩️ Phản hồi ({replies.length})
        </button>
      </div>

      {/* Reply Form */}
      {showReplyForm && (
        <ReplyForm
          commentId={comment.id}
          onSubmit={async (cId, text) => {
            await onAddReply(cId, text)
            setShowReplyForm(false)
          }}
        />
      )}

      {/* Replies List */}
      {replies.length > 0 && (
        <div className="pl-10 space-y-2 pt-2">
          {replies.map((reply) => (
            <ReplyItem key={reply.id} reply={reply} />
          ))}
        </div>
      )}
    </div>
  )
}
