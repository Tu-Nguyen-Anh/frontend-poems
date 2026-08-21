import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import type { PoemCompositionResponse } from '@/types'
import { compositionService } from '@/services/composition.service'
import { CompositionCommentSection } from '../components/CompositionCommentSection'
import { CompositionModalForm } from '../components/CompositionModalForm'
import { PATHS } from '@/routes/paths'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/contexts/ToastContext'
import { formatRelativeTime, formatDate } from '@/utils/format'
import { Skeleton } from '@/components/ui/Skeleton'
import { Seo } from '@/components/common/Seo'
import { useLocalStorage } from '@/hooks/useLocalStorage'

const FONT_STEPS = ['text-base sm:text-lg', 'text-lg sm:text-xl', 'text-xl sm:text-2xl', 'text-2xl sm:text-3xl']
const LEADING_STEPS = ['leading-relaxed', 'leading-loose', 'leading-[2.4]']

export default function CompositionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const compositionId = Number(id)
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const { toast } = useToast()

  const [composition, setComposition] = useState<PoemCompositionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorStatus, setErrorStatus] = useState<number | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [copied, setCopied] = useState<'' | 'poem' | 'link'>('')

  const [fontIdx, setFontIdx] = useLocalStorage('compositions_reader_font', 1)
  const [leadingIdx, setLeadingIdx] = useLocalStorage('compositions_reader_leading', 1)

  useEffect(() => {
    async function loadComposition() {
      if (!compositionId) {
        setLoading(false)
        return
      }
      setLoading(true)
      setErrorStatus(null)
      try {
        const data = await compositionService.getById(compositionId)
        setComposition(data)
      } catch (err: any) {
        console.error('Lỗi khi tải chi tiết bài thơ sáng tác:', err)
        setErrorStatus(err?.response?.status || 500)
      } finally {
        setLoading(false)
      }
    }
    loadComposition()
  }, [compositionId])

  const compUserId = composition?.userId ?? composition?.user_id
  const authorName = composition?.penName || composition?.pen_name || composition?.username || 'Ẩn Danh'
  const username = composition?.username || 'user'
  const genreName = composition?.genreName || composition?.genre_name
  const createdAt = composition?.createdAt ?? composition?.created_at
  const isOwner = !!user && (user.id === compUserId || user.username === username)
  const canManage = isOwner || isAdmin

  const handleCopyPoem = () => {
    if (!composition) return
    const textToCopy = `${composition.title}\n\nTác giả: ${authorName}\n\n${composition.content}`
    navigator.clipboard?.writeText(textToCopy).then(() => {
      setCopied('poem')
      toast('Đã sao chép nội dung bài thơ!')
      setTimeout(() => setCopied(''), 2000)
    })
  }

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopied('link')
      toast('Đã sao chép liên kết bài thơ!')
      setTimeout(() => setCopied(''), 2000)
    })
  }

  const handleDelete = async () => {
    if (!composition) return
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài thơ sáng tác này không?')) return
    try {
      await compositionService.delete(composition.id)
      toast('Đã xóa bài thơ thành công!')
      navigate(PATHS.COMPOSITIONS)
    } catch (err) {
      toast(`Không thể xóa bài thơ: ${getErrorMessage(err)}`)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <Skeleton className="h-6 w-1/4 rounded-xl" />
        <Skeleton className="h-12 w-3/4 rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-3xl" />
      </div>
    )
  }

  if (errorStatus === 404 || !composition) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 px-4">
        <span className="text-5xl block mb-4">🔍</span>
        <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100 mb-2">
          Không tìm thấy bài thơ
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          Bài thơ này không tồn tại hoặc đã bị tác giả xóa bỏ.
        </p>
        <Link
          to={PATHS.COMPOSITIONS}
          className="px-6 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-sm transition-colors inline-block"
        >
          ← Quay lại Góc Sáng Tác
        </Link>
      </div>
    )
  }

  if (errorStatus === 401 || errorStatus === 403) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 px-4">
        <span className="text-5xl block mb-4">🔒</span>
        <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100 mb-2">
          Bài thơ riêng tư
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          Bài thơ này đang được đặt ở chế độ Bản nháp hoặc Riêng tư. Bạn cần đăng nhập bằng tài khoản tác giả để xem.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            to={PATHS.COMPOSITIONS}
            className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Về Góc Sáng Tác
          </Link>
          <Link
            to={PATHS.LOGIN}
            className="px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold transition-colors"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <Seo
        title={`${composition.title} – Sáng tác bởi ${authorName}`}
        description={`Đọc bài thơ sáng tác "${composition.title}" của ${authorName} tại Góc Sáng Tác - Tiểu Thi Hào.`}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link to={PATHS.HOME} className="hover:text-amber-700 dark:hover:text-amber-300">
            Trang chủ
          </Link>
          <span>/</span>
          <Link to={PATHS.COMPOSITIONS} className="hover:text-amber-700 dark:hover:text-amber-300">
            Góc Sáng Tác
          </Link>
          <span>/</span>
          <span className="text-slate-800 dark:text-slate-200 truncate max-w-xs">{composition.title}</span>
        </nav>

        {/* Poem Article Card */}
        <article className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-md">
                {authorName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                    {authorName}
                  </span>
                  {composition.status === 'DRAFT' && (
                    <span className="px-2.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 rounded-full border border-amber-200 dark:border-amber-800">
                      Bản nháp
                    </span>
                  )}
                  {composition.status === 'PRIVATE' && (
                    <span className="px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded-full border border-slate-200 dark:border-slate-700">
                      Riêng tư
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <span>@{username}</span>
                  {createdAt && (
                    <>
                      <span>•</span>
                      <time dateTime={createdAt} title={formatDate(createdAt)}>
                        {formatRelativeTime(createdAt)}
                      </time>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {genreName && (
                <span className="px-3 py-1 text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 rounded-xl border border-amber-200/70 dark:border-amber-900/60">
                  {genreName}
                </span>
              )}

              {canManage && (
                <div className="flex items-center gap-1.5 ml-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    <span>Sửa</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    <span>Xóa</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="py-6 text-center">
            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-amber-900 dark:text-amber-200 tracking-tight leading-tight">
              {composition.title}
            </h1>
            <p className="font-serif italic text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2">
              Tác giả: {authorName}
            </p>
          </div>

          {/* Reader Controls Toolbar */}
          <div className="flex items-center justify-between gap-3 py-2.5 px-4 mb-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-4">
              {/* Font Size */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Cỡ chữ:</span>
                <button
                  type="button"
                  onClick={() => setFontIdx(Math.max(0, fontIdx - 1))}
                  disabled={fontIdx === 0}
                  className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 disabled:opacity-40"
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => setFontIdx(Math.min(FONT_STEPS.length - 1, fontIdx + 1))}
                  disabled={fontIdx === FONT_STEPS.length - 1}
                  className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 disabled:opacity-40"
                >
                  A+
                </button>
              </div>

              {/* Line Height */}
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Giãn dòng:</span>
                <button
                  type="button"
                  onClick={() => setLeadingIdx((leadingIdx + 1) % LEADING_STEPS.length)}
                  className="px-2.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono"
                >
                  ↕ {leadingIdx === 0 ? 'Vừa' : leadingIdx === 1 ? 'Rộng' : 'Rất rộng'}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyPoem}
                className="px-3 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-semibold hover:text-amber-700 dark:hover:text-amber-300 transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                  />
                </svg>
                <span>{copied === 'poem' ? 'Đã sao chép' : 'Chép thơ'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-semibold hover:text-amber-700 dark:hover:text-amber-300 transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                <span>{copied === 'link' ? 'Đã chép link' : 'Chia sẻ'}</span>
              </button>
            </div>
          </div>

          {/* Poem Content */}
          <div
            className={`font-serif text-slate-800 dark:text-slate-100 text-center py-6 whitespace-pre-line tracking-wide ${FONT_STEPS[fontIdx]} ${LEADING_STEPS[leadingIdx]}`}
          >
            {composition.content}
          </div>

          {/* Bottom decorative divider */}
          <div className="flex items-center justify-center my-6 text-amber-600/40 dark:text-amber-400/30">
            <span className="text-xl">❦ ❦ ❦</span>
          </div>

          {/* Comments and Discussion */}
          <CompositionCommentSection compositionId={composition.id} />
        </article>
      </div>

      {/* Edit Modal */}
      <CompositionModalForm
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={(updated) => setComposition(updated)}
        editComposition={composition}
      />
    </>
  )
}
