import { useState, useEffect } from 'react'
import type { PoemCompositionRequest, PoemCompositionResponse, PoemCompositionStatus, GenreResponse } from '@/types'
import { genreService } from '@/services/genre.service'
import { compositionService } from '@/services/composition.service'
import { useToast } from '@/contexts/ToastContext'
import { useAuth } from '@/hooks/useAuth'
import { getErrorMessage } from '@/utils/error'

interface CompositionModalFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (composition: PoemCompositionResponse) => void
  editComposition?: PoemCompositionResponse | null
}

const MAX_TITLE_LEN = 200
const MAX_CONTENT_LEN = 2000

export function CompositionModalForm({
  isOpen,
  onClose,
  onSuccess,
  editComposition,
}: CompositionModalFormProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  // Tên người đang đăng nhập — dùng làm bút danh mặc định (vẫn cho sửa)
  const currentUserName = (user?.displayName || user?.username || '').trim()

  const [title, setTitle] = useState('')
  const [penName, setPenName] = useState('')
  const [genreId, setGenreId] = useState<number | undefined>(undefined)
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<PoemCompositionStatus>('PUBLISHED')
  const [genres, setGenres] = useState<GenreResponse[]>([])
  const [loadingGenres, setLoadingGenres] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Load genres for selection
  useEffect(() => {
    if (!isOpen) return
    async function loadGenres() {
      setLoadingGenres(true)
      try {
        const res = await genreService.getGenres({ isAll: true })
        setGenres(res.content || [])
      } catch (err) {
        console.error('Lỗi khi tải danh sách thể loại:', err)
      } finally {
        setLoadingGenres(false)
      }
    }
    loadGenres()
  }, [isOpen])

  // Populate data when editing
  useEffect(() => {
    if (editComposition) {
      setTitle(editComposition.title || '')
      setPenName(editComposition.penName || editComposition.pen_name || '')
      setGenreId(editComposition.genreId ?? editComposition.genre_id)
      setContent(editComposition.content || '')
      setStatus(editComposition.status || 'PUBLISHED')
    } else {
      setTitle('')
      // Bút danh tự điền tên người đang đăng nhập; người dùng có thể sửa lại
      setPenName(currentUserName)
      setGenreId(undefined)
      setContent('')
      setStatus('PUBLISHED')
    }
    setErrorMsg('')
  }, [editComposition, isOpen, currentUserName])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()

    if (!trimmedTitle) {
      setErrorMsg('Vui lòng nhập tiêu đề bài thơ.')
      return
    }
    if (!trimmedContent) {
      setErrorMsg('Vui lòng nhập nội dung bài thơ.')
      return
    }
    if (trimmedTitle.length > MAX_TITLE_LEN) {
      setErrorMsg(`Tiêu đề không được vượt quá ${MAX_TITLE_LEN} ký tự.`)
      return
    }
    if (trimmedContent.length > MAX_CONTENT_LEN) {
      setErrorMsg(`Nội dung bài thơ không được vượt quá ${MAX_CONTENT_LEN} ký tự.`)
      return
    }

    const payload: PoemCompositionRequest = {
      title: trimmedTitle,
      content: trimmedContent,
      penName: penName.trim() || undefined,
      pen_name: penName.trim() || undefined,
      genreId: genreId || undefined,
      genre_id: genreId || undefined,
      status,
    }

    setSubmitting(true)
    try {
      let result: PoemCompositionResponse
      if (editComposition?.id) {
        result = await compositionService.update(editComposition.id, payload)
        toast('Đã cập nhật bài thơ thành công!')
      } else {
        result = await compositionService.create(payload)
        toast('Đã đăng bài thơ mới thành công!')
      }
      onSuccess(result)
      onClose()
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 400) {
        const detail = err?.response?.data?.message || ''
        if (detail.toLowerCase().includes('limit') || detail.toLowerCase().includes('many requests')) {
          setErrorMsg('Bạn đã vượt quá giới hạn đăng 5 bài thơ trong 24 giờ. Vui lòng thử lại sau!')
        } else {
          setErrorMsg(getErrorMessage(err) || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại!')
        }
      } else if (status === 401) {
        setErrorMsg('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!')
      } else if (status === 403) {
        setErrorMsg('Bạn không có quyền thực hiện thao tác này!')
      } else {
        setErrorMsg(getErrorMessage(err) || 'Đã có lỗi xảy ra khi lưu bài thơ. Vui lòng thử lại!')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 my-8 text-slate-900 dark:text-slate-100 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-amber-900 dark:text-amber-200">
              {editComposition ? 'Chỉnh sửa bài thơ' : 'Sáng tác bài thơ mới'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Chia sẻ những vần thơ đầy cảm xúc của bạn tới cộng đồng độc giả
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Đóng"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-start gap-2.5">
            <svg className="w-5 h-5 flex-shrink-0 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tiêu đề bài thơ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={MAX_TITLE_LEN}
                placeholder="VD: Chiều Hoang, Nắng Mùa Thu..."
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                required
              />
              <div className="flex justify-end mt-1 text-[11px] text-slate-400">
                {title.length}/{MAX_TITLE_LEN}
              </div>
            </div>

            {/* Pen Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Bút danh (Tác giả)
              </label>
              <input
                type="text"
                value={penName}
                onChange={(e) => setPenName(e.target.value)}
                maxLength={50}
                placeholder="VD: Hải Đăng, Ẩn Danh..."
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Mặc định là tên tài khoản của bạn — có thể sửa thành bút danh khác.
              </p>
            </div>

            {/* Genre */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Thể thơ
              </label>
              <select
                value={genreId || ''}
                onChange={(e) => setGenreId(e.target.value ? Number(e.target.value) : undefined)}
                disabled={loadingGenres}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              >
                <option value="">-- Chọn thể loại thơ --</option>
                {genres.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Chế độ xuất bản
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <label
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                  status === 'PUBLISHED'
                    ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-900 dark:text-amber-200 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value="PUBLISHED"
                  checked={status === 'PUBLISHED'}
                  onChange={() => setStatus('PUBLISHED')}
                  className="sr-only"
                />
                <span>Công khai</span>
              </label>

              <label
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                  status === 'DRAFT'
                    ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-900 dark:text-amber-200 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value="DRAFT"
                  checked={status === 'DRAFT'}
                  onChange={() => setStatus('DRAFT')}
                  className="sr-only"
                />
                <span>Bản nháp</span>
              </label>

              <label
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                  status === 'PRIVATE'
                    ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-900 dark:text-amber-200 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value="PRIVATE"
                  checked={status === 'PRIVATE'}
                  onChange={() => setStatus('PRIVATE')}
                  className="sr-only"
                />
                <span>Riêng tư</span>
              </label>
            </div>
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nội dung bài thơ <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-xs ${
                  content.length > MAX_CONTENT_LEN ? 'text-rose-500 font-bold' : 'text-slate-400'
                }`}
              >
                {content.length}/{MAX_CONTENT_LEN} ký tự
              </span>
            </div>
            <textarea
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập từng khổ thơ, xuống dòng giữa các câu..."
              className="w-full p-4 font-serif text-sm sm:text-base leading-relaxed bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-y"
              required
            />
          </div>

          {/* Note on Rate Limit */}
          <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40 rounded-xl text-[12px] text-amber-800 dark:text-amber-300">
            Để bảo đảm chất lượng nội dung, mỗi tác giả có thể đăng tối đa 5 bài trong 24 giờ.
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !content.trim() || content.length > MAX_CONTENT_LEN}
              className="px-6 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold shadow-md transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang lưu bài...</span>
                </>
              ) : (
                <span>{editComposition ? 'Lưu thay đổi' : 'Đăng bài thơ'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
