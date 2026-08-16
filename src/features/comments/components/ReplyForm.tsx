import { useEffect, useRef, useState } from 'react'
import { fileService } from '@/services/file.service'
import { useToast } from '@/contexts/ToastContext'
import { getErrorMessage } from '@/utils/error'
import { formatFileSize } from '@/utils/format'

const MAX_LEN = 1000

interface ReplyFormProps {
  commentId: number
  /** Username đang được trả lời — hiện dòng "Đang trả lời @..." và prefill @mention khi trả lời sub comment */
  replyingTo?: string
  /** Prefill "@username " vào ô nhập (khi trả lời một sub comment) */
  mention?: string
  onSubmit: (commentId: number, content: string) => Promise<void>
  onCancel?: () => void
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

/** Form trả lời kiểu diễn đàn (pattern tu-vi-v1): dòng "Đang trả lời @xxx · Hủy",
 * textarea + đính kèm tệp/ảnh + đếm ký tự, nút gửi bên phải. */
export function ReplyForm({ commentId, replyingTo, mention, onSubmit, onCancel }: ReplyFormProps) {
  const { toast } = useToast()
  const [content, setContent] = useState(mention ? `@${mention} ` : '')
  const [attachments, setAttachments] = useState<AttachedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Đổi người được trả lời → prefill lại mention + focus cuối dòng
  useEffect(() => {
    setContent(mention ? `@${mention} ` : '')
    const el = inputRef.current
    if (el) {
      el.focus()
      el.setSelectionRange(el.value.length, el.value.length)
    }
  }, [mention, commentId])

  const handleSelectFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (attachments.length + files.length > 3) {
      toast('Bạn chỉ có thể đính kèm tối đa 3 tệp cho mỗi câu trả lời.')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    let finalContent = content.trim()
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

    if (!finalContent || finalContent.length > MAX_LEN) return
    setSubmitting(true)
    try {
      await onSubmit(commentId, finalContent)
      setContent('')
      setAttachments([])
    } finally {
      setSubmitting(false)
    }
  }

  const overLimit = content.length > MAX_LEN

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2.5 p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"
    >
      {replyingTo && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Đang trả lời{' '}
          <span className="font-semibold text-amber-700 dark:text-amber-400">@{replyingTo}</span>
          {onCancel && (
            <>
              {' · '}
              <button
                type="button"
                onClick={onCancel}
                className="text-slate-400 hover:text-rose-500 underline-offset-2 hover:underline"
              >
                Hủy
              </button>
            </>
          )}
        </p>
      )}
      <textarea
        ref={inputRef}
        rows={2}
        placeholder="Viết câu trả lời..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        autoFocus
        className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 placeholder-slate-400 resize-y focus:outline-none focus:ring-2 focus:ring-amber-500/30 leading-relaxed"
      />

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="relative group flex items-center gap-1.5 p-1.5 pr-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 max-w-[200px]"
            >
              {att.isImage ? (
                <img src={att.url} alt={att.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded bg-amber-100 dark:bg-slate-800 flex items-center justify-center text-sm flex-shrink-0">
                  {getFileIcon(att.name, att.isAudio)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate" title={att.name}>
                  {att.name}
                </p>
                {att.size && <p className="text-[9px] text-slate-400">{formatFileSize(att.size)}</p>}
              </div>
              <button
                type="button"
                onClick={() => handleRemoveAttachment(idx)}
                className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center text-[10px] hover:bg-rose-600"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-0.5">
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
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || submitting || attachments.length >= 3}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300 disabled:opacity-50 transition-colors"
            title="Đính kèm ảnh, âm thanh hoặc tài liệu"
          >
            {uploading ? (
              <>
                <span className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                <span>Đang tải...</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
                <span>Tệp ({attachments.length}/3)</span>
              </>
            )}
          </button>

          <span className={`text-[11px] ${overLimit ? 'text-rose-500 font-semibold' : 'text-slate-400'}`}>
            {content.length}/{MAX_LEN}
          </span>
        </div>

        <button
          type="submit"
          disabled={submitting || uploading || (!content.trim() && attachments.length === 0) || overLimit}
          className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-md transition-colors disabled:opacity-50"
        >
          {submitting ? 'Đang gửi…' : 'Gửi trả lời'}
        </button>
      </div>
    </form>
  )
}
