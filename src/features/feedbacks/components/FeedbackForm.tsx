import { useState, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useGuestCTAModal } from '@/contexts/GuestCTAModalContext'
import { useToast } from '@/contexts/ToastContext'
import { feedbackService } from '@/services/feedback.service'
import { fileService } from '@/services/file.service'
import { getErrorMessage } from '@/utils/error'
import { formatFileSize } from '@/utils/format'

interface FeedbackFormProps {
  poemId: number
}

interface AttachedFile {
  url: string
  name: string
  fileName?: string
  size?: number
  isImage: boolean
  isAudio: boolean
}

function getFileIcon(filename: string, isAudio: boolean) {
  if (isAudio) return '🎵'
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  if (['pdf'].includes(ext)) return '📄'
  if (['doc', 'docx', 'txt'].includes(ext)) return '📝'
  if (['zip', 'rar', '7z'].includes(ext)) return '📦'
  return '📎'
}

export function FeedbackForm({ poemId }: FeedbackFormProps) {
  const { isAuthenticated } = useAuth()
  const { openModal } = useGuestCTAModal()
  const { toast } = useToast()

  const [feedbackContent, setFeedbackContent] = useState('')
  const [attachments, setAttachments] = useState<AttachedFile[]>([])
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

    if (attachments.length + files.length > 3) {
      toast('Bạn chỉ có thể đính kèm tối đa 3 tệp cho mỗi góp ý.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setUploading(true)
    try {
      const fileList = Array.from(files)
      for (const f of fileList) {
        if (f.size > 10 * 1024 * 1024) {
          toast(`Tệp "${f.name}" vượt quá giới hạn 10MB.`)
          continue
        }
        const res = await fileService.uploadFile(f)
        const isImage = (res.contentType || f.type).startsWith('image/')
        const isAudio =
          (res.contentType || f.type).startsWith('audio/') ||
          /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(f.name)

        setAttachments((prev) => [
          ...prev,
          {
            url: res.url,
            name: f.name,
            fileName: res.file_name || res.fileName,
            size: f.size,
            isImage,
            isAudio,
          },
        ])
      }
    } catch (err) {
      toast(`Lỗi khi tải tệp: ${getErrorMessage(err)}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      openModal('gửi góp ý')
      return
    }

    let finalContent = feedbackContent.trim()
    if (attachments.length > 0) {
      const formattedAttachments = attachments
        .map((att) => {
          if (att.isImage) return `![${att.name}](${att.url})`
          if (att.isAudio) return `[🎵 Audio: ${att.name}](${att.url})`
          return `[📎 Tệp đính kèm: ${att.name}](${att.url})`
        })
        .join('\n\n')

      finalContent = finalContent ? `${finalContent}\n\n${formattedAttachments}` : formattedAttachments
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
      setAttachments([])
      setTimeout(() => setFeedbackSuccess(false), 4000)
    } catch (err) {
      toast(`Lỗi khi gửi góp ý: ${getErrorMessage(err)}`)
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
        Phát hiện sai sót phiên âm, năm sáng tác hoặc chính tả? Bạn có thể gửi phản hồi kèm tài liệu, hình ảnh chụp sách hoặc bản ghi âm đối chiếu cho ban quản trị.
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

        {/* Attachments Preview List */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2.5 pt-1">
            {attachments.map((att, idx) => (
              <div
                key={idx}
                className="relative group flex items-center gap-2 p-2 pr-7 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 shadow-sm max-w-xs overflow-hidden"
              >
                {att.isImage ? (
                  <img src={att.url} alt={att.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-slate-800 flex items-center justify-center text-lg flex-shrink-0">
                    {getFileIcon(att.name, att.isAudio)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={att.name}>
                    {att.name}
                  </p>
                  {att.size && <p className="text-[10px] text-slate-400">{formatFileSize(att.size)}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(idx)}
                  className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] hover:bg-rose-600 hover:text-white transition-all"
                  title="Xóa tệp"
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
              disabled={uploading || submitting || attachments.length >= 3}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-50"
              title="Đính kèm tệp tư liệu / ảnh / âm thanh đối chiếu"
            >
              {uploading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                  <span>Đang tải tệp...</span>
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
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                  <span>Đính kèm tệp ({attachments.length}/3)</span>
                </>
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting || uploading || (!feedbackContent.trim() && attachments.length === 0)}
            className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-medium text-sm rounded-xl transition-colors disabled:opacity-50"
          >
            {submitting ? 'Đang gửi...' : 'Gửi góp ý'}
          </button>
        </div>
      </form>
    </section>
  )
}
