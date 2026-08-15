import { useState, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useGuestCTAModal } from '@/contexts/GuestCTAModalContext'
import { useToast } from '@/contexts/ToastContext'
import { feedbackService } from '@/services/feedback.service'
import { fileService } from '@/services/file.service'
import { getErrorMessage } from '@/utils/error'

interface FeedbackFormProps {
  poemId: number
}

interface AttachedImage {
  url: string
  name: string
  fileName?: string
}

export function FeedbackForm({ poemId }: FeedbackFormProps) {
  const { isAuthenticated } = useAuth()
  const { openModal } = useGuestCTAModal()
  const { toast } = useToast()

  const [feedbackContent, setFeedbackContent] = useState('')
  const [images, setImages] = useState<AttachedImage[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [feedbackSuccess, setFeedbackSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSelectFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (!isAuthenticated) {
      openModal('gửi góp ý')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    if (images.length + files.length > 3) {
      toast('Bạn chỉ có thể đính kèm tối đa 3 ảnh cho mỗi góp ý.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setUploading(true)
    try {
      const fileList = Array.from(files)
      for (const f of fileList) {
        if (!f.type.startsWith('image/')) {
          toast(`File "${f.name}" không phải là ảnh hợp lệ.`)
          continue
        }
        const res = await fileService.uploadFile(f)
        setImages((prev) => [
          ...prev,
          { url: res.url, name: f.name, fileName: res.file_name || res.fileName },
        ])
      }
    } catch (err) {
      toast(`Lỗi khi tải ảnh: ${getErrorMessage(err)}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      openModal('gửi góp ý')
      return
    }

    let finalContent = feedbackContent.trim()
    if (images.length > 0) {
      const imgMarkdown = images.map((img) => `![${img.name}](${img.url})`).join('\n')
      finalContent = finalContent ? `${finalContent}\n\n${imgMarkdown}` : imgMarkdown
    }

    if (!finalContent) return

    setSubmitting(true)
    try {
      await feedbackService.createFeedback({
        poemId,
        content: finalContent,
      })
      setFeedbackSuccess(true)
      setFeedbackContent('')
      setImages([])
      setTimeout(() => setFeedbackSuccess(false), 4000)
    } catch (err) {
      toast(`Lỗi khi gửi nhận xét / góp ý: ${getErrorMessage(err)}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
      <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-amber-100 flex items-center gap-2">
        Góp ý / sửa lỗi bài thơ
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Phát hiện sai sót phiên âm, năm sáng tác hoặc chính tả? Bạn có thể gửi phản hồi kèm hình ảnh chụp sách/tư liệu đối chiếu cho ban quản trị.
      </p>

      {feedbackSuccess && (
        <div className="p-3 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 rounded-xl text-xs font-medium border border-emerald-300">
          ✓ Cảm ơn bạn! Góp ý đã được gửi đến ban quản trị.
        </div>
      )}

      <form onSubmit={handleSubmitFeedback} className="space-y-3">
        <textarea
          rows={3}
          placeholder="Nhập nội dung góp ý của bạn..."
          value={feedbackContent}
          onChange={(e) => setFeedbackContent(e.target.value)}
          onFocus={() => {
            if (!isAuthenticated) openModal('gửi góp ý')
          }}
          className="w-full p-3.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
        />

        {/* Image Preview List */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2.5 pt-1">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="relative group w-20 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900"
              >
                <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-xs opacity-80 hover:opacity-100 hover:bg-rose-600 transition-all"
                  title="Xóa ảnh"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleSelectFiles}
              accept="image/*"
              multiple
              className="hidden"
            />
            <button
              type="button"
              onClick={() => {
                if (!isAuthenticated) {
                  openModal('gửi góp ý')
                  return
                }
                fileInputRef.current?.click()
              }}
              disabled={uploading || submitting || images.length >= 3}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-50"
              title="Đính kèm ảnh tư liệu / đối chiếu"
            >
              {uploading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                  <span>Đang tải ảnh...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 text-amber-700 dark:text-amber-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Đính kèm ảnh ({images.length}/3)</span>
                </>
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting || uploading || (!feedbackContent.trim() && images.length === 0)}
            className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-medium text-sm rounded-xl transition-colors disabled:opacity-50"
          >
            {submitting ? 'Đang gửi...' : 'Gửi góp ý'}
          </button>
        </div>
      </form>
    </section>
  )
}
