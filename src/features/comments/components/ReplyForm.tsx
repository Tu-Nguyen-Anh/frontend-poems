import { useState } from 'react'

interface ReplyFormProps {
  commentId: number
  onSubmit: (commentId: number, content: string) => Promise<void>
}

export function ReplyForm({ commentId, onSubmit }: ReplyFormProps) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    try {
      await onSubmit(commentId, content.trim())
      setContent('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="pl-10 pt-2 flex gap-2">
      <input
        type="text"
        placeholder="Viết phản hồi..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
      />
      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl transition-colors"
      >
        {submitting ? '...' : 'Gửi'}
      </button>
    </form>
  )
}
