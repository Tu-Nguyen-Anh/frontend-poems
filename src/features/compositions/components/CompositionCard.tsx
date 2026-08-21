import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { PoemCompositionResponse } from '@/types'
import { toCompositionDetail } from '@/routes/paths'
import { formatRelativeTime } from '@/utils/format'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/contexts/ToastContext'

interface CompositionCardProps {
  composition: PoemCompositionResponse
  onDelete?: (id: number) => void
  onEdit?: (composition: PoemCompositionResponse) => void
  showFull?: boolean
}

export function CompositionCard({
  composition,
  onDelete,
  onEdit,
  showFull = false,
}: CompositionCardProps) {
  const { user, isAdmin } = useAuth()
  const { toast } = useToast()
  const [expanded, setExpanded] = useState(showFull)
  const [copied, setCopied] = useState(false)

  const compUserId = composition.userId ?? composition.user_id
  const authorName = composition.penName || composition.pen_name || composition.username || 'Ẩn Danh'
  const username = composition.username || 'user'
  const genreName = composition.genreName || composition.genre_name
  const createdAt = composition.createdAt ?? composition.created_at

  const isOwner = !!user && (user.id === compUserId || user.username === username)
  const canManage = isOwner || isAdmin

  const lines = (composition.content || '').split('\n')
  const isLong = lines.length > 6
  const displayContent =
    expanded || showFull || !isLong
      ? composition.content
      : lines.slice(0, 5).join('\n') + '\n...'

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const textToCopy = `${composition.title}\n\nTác giả: ${authorName}\n\n${composition.content}`
    navigator.clipboard?.writeText(textToCopy).then(() => {
      setCopied(true)
      toast('Đã sao chép bài thơ vào khay nhớ tạm!')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const url = `${window.location.origin}${toCompositionDetail(composition.id)}`
    if (navigator.share) {
      navigator
        .share({
          title: composition.title,
          text: `Đọc bài thơ sáng tác "${composition.title}" của ${authorName} trên Tiểu Thi Hào`,
          url,
        })
        .catch(() => {})
    } else {
      navigator.clipboard?.writeText(url).then(() => {
        toast('Đã sao chép liên kết bài thơ!')
      })
    }
  }

  return (
    <article className="group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Header: Author info, timestamp, status & options */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
              {authorName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
                  {authorName}
                </span>
                {composition.status === 'DRAFT' && (
                  <span className="px-2 py-0.5 text-[11px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 rounded-full border border-amber-200 dark:border-amber-800">
                    Bản nháp
                  </span>
                )}
                {composition.status === 'PRIVATE' && (
                  <span className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded-full border border-slate-200 dark:border-slate-700">
                    Riêng tư
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>@{username}</span>
                {createdAt && (
                  <>
                    <span>•</span>
                    <time dateTime={createdAt}>{formatRelativeTime(createdAt)}</time>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {genreName && (
              <span className="inline-block px-2.5 py-1 text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-lg border border-amber-200/60 dark:border-amber-900/60">
                {genreName}
              </span>
            )}
            {canManage && (
              <div className="flex items-center gap-1 ml-1">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(composition)}
                    className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-xs"
                    title="Chỉnh sửa bài thơ"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(composition.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors text-xs"
                    title="Xóa bài thơ"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <Link
          to={toCompositionDetail(composition.id)}
          className="block group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors mb-3"
        >
          <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
            {composition.title}
          </h3>
        </Link>

        {/* Poem Content */}
        <div className="font-serif text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed sm:leading-loose whitespace-pre-line pl-3 border-l-2 border-amber-300 dark:border-amber-700/60 my-3">
          {displayContent}
        </div>

        {isLong && !showFull && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline mt-1 mb-2"
          >
            {expanded ? 'Thu gọn' : 'Xem toàn bộ bài thơ'}
          </button>
        )}
      </div>

      {/* Footer Actions */}
      <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <Link
            to={toCompositionDetail(composition.id)}
            className="inline-flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span>Bình luận</span>
          </Link>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
            title="Sao chép bài thơ"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
              />
            </svg>
            <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
            title="Chia sẻ bài thơ"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            <span>Chia sẻ</span>
          </button>
        </div>

        <Link
          to={toCompositionDetail(composition.id)}
          className="inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
        >
          <span>Chi tiết</span>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </article>
  )
}
