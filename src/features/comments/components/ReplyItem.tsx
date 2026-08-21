import type { ReplyResponse } from '@/types'
import { formatRelativeTime } from '@/utils/format'
import { RichContent } from '@/components/common/RichContent'
import { useAuth } from '@/hooks/useAuth'

interface ReplyItemProps {
  reply: ReplyResponse
  /** Username của comment cha — hiện dòng "Trả lời @..." */
  parentUsername?: string
  /** Bấm "Trả lời" trên sub comment này — mở form với @mention */
  onReply?: (username: string) => void
}

export function ReplyItem({ reply, parentUsername, onReply }: ReplyItemProps) {
  const { user } = useAuth()
  const createdAt = reply.createdAt ?? reply.created_at
  const replyUserId = reply.userId ?? reply.user_id
  const isOwner = !!user && (user.id === replyUserId || user.username === reply.username)
  const userAvatar = isOwner
    ? (user?.id ? localStorage.getItem(`user_avatar_${user.id}`) : null) ||
      (user?.username ? localStorage.getItem(`user_avatar_${user.username}`) : null) ||
      (user as any)?.avatarUrl ||
      (user as any)?.avatar_url ||
      null
    : (replyUserId ? localStorage.getItem(`user_avatar_${replyUserId}`) : null) ||
      (reply.username ? localStorage.getItem(`user_avatar_${reply.username}`) : null) ||
      null

  return (
    <div className="poem-comment">
      <div className="poem-comment-avatar">
        {userAvatar ? (
          <img
            src={userAvatar}
            alt={reply.username}
            className="w-[30px] h-[30px] rounded-full object-cover border border-amber-500 shadow-sm"
          />
        ) : (
          <div className="w-[30px] h-[30px] rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-[11px]">
            {reply.username.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <div className="flex items-baseline flex-wrap gap-x-2">
          <span className="text-sm font-bold text-amber-800 dark:text-amber-300">
            {reply.username}
          </span>
          {createdAt && (
            <span className="text-xs text-slate-400">{formatRelativeTime(createdAt)}</span>
          )}
        </div>
        {parentUsername && (
          <p className="text-xs text-slate-400 mt-0.5">
            Trả lời <span className="font-semibold text-amber-700 dark:text-amber-400">@{parentUsername}</span>
          </p>
        )}
        <RichContent content={reply.content} className="mt-1" />
        {onReply && (
          <div className="mt-2 pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => onReply(reply.username)}
              className="text-xs text-slate-500 dark:text-slate-400 font-semibold hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
            >
              Trả lời
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

