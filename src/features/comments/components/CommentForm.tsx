import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useGuestCTAModal } from '@/contexts/GuestCTAModalContext'

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>
}

export function CommentForm({ onSubmit }: CommentFormProps) {
  const { isAuthenticated } = useAuth()
  const { openModal } = useGuestCTAModal()
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      openModal('viết bình luận')
      return
    }
    if (!content.trim()) return

    setSubmitting(true)
    try {
      await onSubmit(content.trim())
      setContent('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <textarea
          rows={3}
          placeholder={
            isAuthenticated
              ? 'Viết suy ngẫm, cảm nhận của bạn về bài thơ này...'
              : 'Đăng nhập ngay để tham gia bình luận cùng độc giả!'
          }
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => {
            if (!isAuthenticated) openModal('viết bình luận')
          }}
          className="w-full p-4 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
        />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-medium text-sm rounded-xl transition-colors disabled:opacity-50"
        >
          {submitting ? 'Đang gửi...' : 'Gửi bình luận'}
        </button>
      </div>
    </form>
  )
}
