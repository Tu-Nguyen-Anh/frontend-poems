import { IconEye, IconHeart, IconComment, IconShare } from '@/components/ui/icons'
import { formatNumber } from '@/utils/format'

export interface PoemStatsPanelProps {
  viewCount: number
  favoriteCount: number
  commentCount: number
  shareCount: number
  loading?: boolean
  onCommentClick?: () => void
  onShareClick?: () => void
}

export function PoemStatsPanel({
  viewCount,
  favoriteCount,
  commentCount,
  shareCount,
  loading = false,
  onCommentClick,
  onShareClick,
}: PoemStatsPanelProps) {
  return (
    <div className="w-full bg-amber-50/50 dark:bg-slate-900/50 border border-amber-900/10 dark:border-slate-700/60 rounded-xl p-3 sm:p-4 transition-colors">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {/* Lượt xem */}
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/70 dark:bg-slate-800/70 border border-amber-900/5 dark:border-slate-700/40">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
            <IconEye size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">Lượt xem</div>
            <div className="text-sm sm:text-base font-bold font-mono text-slate-800 dark:text-slate-100">
              {loading ? <span className="inline-block w-8 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /> : formatNumber(viewCount)}
            </div>
          </div>
        </div>

        {/* Yêu thích */}
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/70 dark:bg-slate-800/70 border border-amber-900/5 dark:border-slate-700/40">
          <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
            <IconHeart size={18} fill />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">Yêu thích</div>
            <div className="text-sm sm:text-base font-bold font-mono text-slate-800 dark:text-slate-100">
              {loading ? <span className="inline-block w-8 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /> : formatNumber(favoriteCount)}
            </div>
          </div>
        </div>

        {/* Bình luận */}
        <button
          type="button"
          onClick={onCommentClick}
          className={`flex items-center gap-2.5 p-2.5 rounded-lg bg-white/70 dark:bg-slate-800/70 border border-amber-900/5 dark:border-slate-700/40 text-left transition-colors ${
            onCommentClick ? 'hover:bg-amber-100/50 dark:hover:bg-slate-700/60 cursor-pointer' : ''
          }`}
          title={onCommentClick ? 'Xem bình luận' : undefined}
        >
          <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            <IconComment size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">Bình luận</div>
            <div className="text-sm sm:text-base font-bold font-mono text-slate-800 dark:text-slate-100">
              {loading ? <span className="inline-block w-8 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /> : formatNumber(commentCount)}
            </div>
          </div>
        </button>

        {/* Chia sẻ */}
        <button
          type="button"
          onClick={onShareClick}
          className={`flex items-center gap-2.5 p-2.5 rounded-lg bg-white/70 dark:bg-slate-800/70 border border-amber-900/5 dark:border-slate-700/40 text-left transition-colors ${
            onShareClick ? 'hover:bg-amber-100/50 dark:hover:bg-slate-700/60 cursor-pointer' : ''
          }`}
          title={onShareClick ? 'Chia sẻ bài thơ' : undefined}
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <IconShare size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">Chia sẻ</div>
            <div className="text-sm sm:text-base font-bold font-mono text-slate-800 dark:text-slate-100">
              {loading ? <span className="inline-block w-8 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /> : formatNumber(shareCount)}
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}
