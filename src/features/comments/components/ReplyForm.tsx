import { useEffect, useRef, useState } from 'react'

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

/** Form trả lời kiểu diễn đàn (pattern tu-vi-v1): dòng "Đang trả lời @xxx · Hủy",
 * textarea + đếm ký tự, nút gửi bên phải. */
export function ReplyForm({ commentId, replyingTo, mention, onSubmit, onCancel }: ReplyFormProps) {
  const [content, setContent] = useState(mention ? `@${mention} ` : '')
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Đổi người được trả lời → prefill lại mention + focus cuối dòng
  useEffect(() => {
    setContent(mention ? `@${mention} ` : '')
    const el = inputRef.current
    if (el) {
      el.focus()
      el.setSelectionRange(el.value.length, el.value.length)
    }
  }, [mention, commentId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || content.length > MAX_LEN) return
    setSubmitting(true)
    try {
      await onSubmit(commentId, content.trim())
      setContent('')
    } finally {
      setSubmitting(false)
    }
  }

  const overLimit = content.length > MAX_LEN

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
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
      <div className="flex items-center justify-end gap-3">
        <span className={`mr-auto text-xs ${overLimit ? 'text-rose-500 font-semibold' : 'text-slate-400'}`}>
          {content.length}/{MAX_LEN}
        </span>
        <button
          type="submit"
          disabled={submitting || !content.trim() || overLimit}
          className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-md transition-colors disabled:opacity-50"
        >
          {submitting ? 'Đang gửi…' : 'Gửi trả lời'}
        </button>
      </div>
    </form>
  )
}
