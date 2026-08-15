import { useEffect, useRef, useState } from 'react'
import { fileService } from '@/services/file.service'
import { useToast } from '@/contexts/ToastContext'
import { getErrorMessage } from '@/utils/error'

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

interface AttachedImage {
  url: string
  name: string
  fileName?: string
}

/** Form trả lời kiểu diễn đàn (pattern tu-vi-v1): dòng "Đang trả lời @xxx · Hủy",
 * textarea + đính kèm ảnh + đếm ký tự, nút gửi bên phải. */
export function ReplyForm({ commentId, replyingTo, mention, onSubmit, onCancel }: ReplyFormProps) {
  const { toast } = useToast()
  const [content, setContent] = useState(mention ? `@${mention} ` : '')
  const [images, setImages] = useState<AttachedImage[]>([])
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

    if (images.length + files.length > 3) {
      toast('Bạn chỉ có thể đính kèm tối đa 3 ảnh cho mỗi câu trả lời.')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    let finalContent = content.trim()
    if (images.length > 0) {
      const imgMarkdown = images.map((img) => `![${img.name}](${img.url})`).join('\n')
      finalContent = finalContent ? `${finalContent}\n\n${imgMarkdown}` : imgMarkdown
    }

    if (!finalContent || finalContent.length > MAX_LEN) return
    setSubmitting(true)
    try {
      await onSubmit(commentId, finalContent)
      setContent('')
      setImages([])
    } finally {
      setSubmitting(false)
    }
  }

  const overLimit = content.length > MAX_LEN

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2.5 p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
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

      {/* Images preview */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative group w-16 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700"
            >
              <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemoveImage(idx)}
                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center text-[10px] hover:bg-rose-600"
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
            accept="image/*"
            multiple
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || submitting || images.length >= 3}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300 disabled:opacity-50"
            title="Đính kèm ảnh"
          >
            {uploading ? (
              'Đang tải...'
            ) : (
              <>
                <svg className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Ảnh ({images.length}/3)</span>
              </>
            )}
          </button>

          <span className={`text-[11px] ${overLimit ? 'text-rose-500 font-semibold' : 'text-slate-400'}`}>
            {content.length}/{MAX_LEN}
          </span>
        </div>

        <button
          type="submit"
          disabled={submitting || uploading || (!content.trim() && images.length === 0) || overLimit}
          className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-md transition-colors disabled:opacity-50"
        >
          {submitting ? 'Đang gửi…' : 'Gửi trả lời'}
        </button>
      </div>
    </form>
  )
}
