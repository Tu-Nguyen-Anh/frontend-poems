import { useState, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useGuestCTAModal } from '@/contexts/GuestCTAModalContext'
import { useToast } from '@/contexts/ToastContext'
import { fileService } from '@/services/file.service'
import { getErrorMessage } from '@/utils/error'
import { formatFileSize } from '@/utils/format'

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>
}

interface AttachedFile {
  url: string
  name: string
  fileName?: string
  size?: number
  contentType?: string
  isImage: boolean
  isAudio: boolean
}

function getFileIcon(filename: string, isAudio: boolean) {
  if (isAudio) return '🎵'
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  if (['pdf'].includes(ext)) return '📄'
  if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) return '📝'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊'
  if (['zip', 'rar', '7z'].includes(ext)) return '📦'
  return '📎'
}

export function CommentForm({ onSubmit }: CommentFormProps) {
  const { isAuthenticated } = useAuth()
  const { openModal } = useGuestCTAModal()
  const { toast } = useToast()

  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState<AttachedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSelectFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (!isAuthenticated) {
      openModal('đính kèm tệp')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    if (attachments.length + files.length > 5) {
      toast('Bạn chỉ có thể đính kèm tối đa 5 tệp cho mỗi bình luận.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setUploading(true)
    try {
      const fileList = Array.from(files)
      for (const f of fileList) {
        if (f.size > 10 * 1024 * 1024) {
          toast(`Tệp "${f.name}" vượt quá dung lượng tối đa 10MB.`)
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
            contentType: res.contentType || f.type,
            isImage,
            isAudio,
          },
        ])
      }
    } catch (err) {
      toast(`Lỗi khi tải tệp lên: ${getErrorMessage(err)}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemoveAttachment = async (index: number) => {
    const target = attachments[index]
    if (target?.fileName) {
      try {
        await fileService.deleteFile(target.fileName)
      } catch {
        // Ignore deletion error
      }
    }
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      openModal('viết bình luận')
      return
    }

    let finalContent = content.trim()
    if (attachments.length > 0) {
      const formattedAttachments = attachments
        .map((att) => {
          if (att.isImage) {
            return `![${att.name}](${att.url})`
          }
          if (att.isAudio) {
            return `[🎵 Audio: ${att.name}](${att.url})`
          }
          return `[📎 Tệp đính kèm: ${att.name}](${att.url})`
        })
        .join('\n\n')

      finalContent = finalContent ? `${finalContent}\n\n${formattedAttachments}` : formattedAttachments
    }

    if (!finalContent) return

    setSubmitting(true)
    try {
      await onSubmit(finalContent)
      setContent('')
      setAttachments([])
    } finally {
      setSubmitting(false)
    }
  }

  const MAX_LEN = 1000
  const overLimit = content.length > MAX_LEN

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        rows={3}
        placeholder={
          isAuthenticated
            ? 'Viết suy ngẫm, cảm nhận hoặc đính kèm ảnh/bản ghi âm về bài thơ này...'
            : 'Đăng nhập ngay để tham gia bình luận cùng độc giả!'
        }
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onFocus={() => {
          if (!isAuthenticated) openModal('viết bình luận')
        }}
        className="w-full p-4 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 resize-y focus:outline-none focus:ring-2 focus:ring-amber-500/40 leading-relaxed"
      />

      {/* Attachments Preview List */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2.5 pt-1">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="relative group flex items-center gap-2 p-2 pr-7 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm max-w-xs overflow-hidden"
            >
              {att.isImage ? (
                <img
                  src={att.url}
                  alt={att.name}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 flex items-center justify-center text-xl flex-shrink-0">
                  {getFileIcon(att.name, att.isAudio)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={att.name}>
                  {att.name}
                </p>
                {att.size && (
                  <p className="text-[11px] text-slate-400">
                    {formatFileSize(att.size)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemoveAttachment(idx)}
                className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs hover:bg-rose-600 hover:text-white transition-all"
                title="Xóa tệp đính kèm"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
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
                openModal('đính kèm tệp')
                return
              }
              fileInputRef.current?.click()
            }}
            disabled={uploading || submitting || attachments.length >= 5}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-50"
            title="Đính kèm ảnh, âm thanh hoặc tài liệu (tối đa 5 tệp)"
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
                <span>Đính kèm tệp ({attachments.length}/5)</span>
              </>
            )}
          </button>

          <span
            className={`text-xs ${overLimit ? 'text-rose-500 font-semibold' : 'text-slate-400'}`}
          >
            {content.length}/{MAX_LEN}
          </span>
        </div>

        <button
          type="submit"
          disabled={submitting || uploading || overLimit || (!content.trim() && attachments.length === 0)}
          className="px-6 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-medium text-sm rounded-xl transition-colors disabled:opacity-50"
        >
          {submitting ? 'Đang gửi...' : 'Gửi bình luận'}
        </button>
      </div>
    </form>
  )
}
