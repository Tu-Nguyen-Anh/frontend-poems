import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useGuestCTAModal } from '@/contexts/GuestCTAModalContext'
import { feedbackService } from '@/services/feedback.service'

import { getErrorMessage } from '@/utils/error'

interface FeedbackFormProps {
  poemId: number
}

export function FeedbackForm({ poemId }: FeedbackFormProps) {
  const { isAuthenticated } = useAuth()
  const { openModal } = useGuestCTAModal()

  const [feedbackContent, setFeedbackContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedbackSuccess, setFeedbackSuccess] = useState(false)

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      openModal('gửi góp ý')
      return
    }
    if (!feedbackContent.trim()) return

    setSubmitting(true)
    try {
      await feedbackService.createFeedback({
        poemId,
        content: feedbackContent.trim(),
      })
      setFeedbackSuccess(true)
      setFeedbackContent('')
      setTimeout(() => setFeedbackSuccess(false), 4000)
    } catch (err) {
      alert(`Lỗi khi gửi nhận xét / góp ý: ${getErrorMessage(err)}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
      <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-amber-100 flex items-center gap-2">
        📩 Góp Ý / Sửa Lỗi Bài Thơ
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Phát hiện sai sót phiên âm, năm sáng tác hoặc chính tả? Hãy gửi phản hồi cho ban quản trị.
      </p>

      {feedbackSuccess && (
        <div className="p-3 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 rounded-xl text-xs font-medium border border-emerald-300">
          ✅ Cảm ơn bạn! Phản hồi góp ý đã được gửi thành công đến Admin.
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
          className="w-full p-3.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm rounded-xl shadow-md transition transform active:scale-95 disabled:opacity-50"
          >
            {submitting ? 'Đang gửi...' : 'Gửi Góp Ý'}
          </button>
        </div>
      </form>
    </section>
  )
}
