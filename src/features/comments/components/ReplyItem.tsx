import type { ReplyResponse } from '@/types'

interface ReplyItemProps {
  reply: ReplyResponse
}

export function ReplyItem({ reply }: ReplyItemProps) {
  return (
    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 text-xs">
      <div className="flex items-center justify-between mb-1">
        <span className="font-bold text-slate-800 dark:text-amber-200">
          {reply.username}
        </span>
        <span className="text-[10px] text-slate-400">
          {new Date(reply.createdAt).toLocaleDateString('vi-VN')}
        </span>
      </div>
      <p className="text-slate-600 dark:text-slate-300">{reply.content}</p>
    </div>
  )
}
