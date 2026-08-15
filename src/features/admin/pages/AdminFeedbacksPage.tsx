import { useState, useEffect } from 'react'
import { feedbackService } from '@/services/feedback.service'
import { FeedbackStatus, type FeedbackResponse } from '@/types'
import { Link } from 'react-router-dom'
import { toPoemDetail } from '@/routes/paths'
import { getErrorMessage } from '@/utils/error'
import { useToast } from '@/contexts/ToastContext'
import { RichContent } from '@/components/common/RichContent'

export default function AdminFeedbacksPage() {
  const { toast } = useToast()
  const [feedbacks, setFeedbacks] = useState<FeedbackResponse[]>([])
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | ''>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [statusFilter])

  async function loadData() {
    setLoading(true)
    try {
      const res = await feedbackService.getFeedbacks({
        status: statusFilter || undefined,
        isAll: true,
      })
      setFeedbacks(res.content || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id: number, status: FeedbackStatus) => {
    try {
      await feedbackService.updateFeedbackStatus(id, status)
      setFeedbacks((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status } : f))
      )
    } catch (err) {
      toast(`Lỗi khi duyệt / từ chối góp ý: ${getErrorMessage(err)}`)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa góp ý này?')) return
    try {
      await feedbackService.deleteFeedback(id)
      setFeedbacks((prev) => prev.filter((f) => f.id !== id))
    } catch (err) {
      toast(`Lỗi khi xóa góp ý: ${getErrorMessage(err)}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-amber-400">Quản lý góp ý</h1>
          <p className="text-slate-400 text-sm">Duyệt hoặc từ chối góp ý của độc giả</p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              statusFilter === '' ? 'bg-amber-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setStatusFilter(FeedbackStatus.PENDING)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              statusFilter === FeedbackStatus.PENDING
                ? 'bg-amber-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Chờ duyệt
          </button>
          <button
            onClick={() => setStatusFilter(FeedbackStatus.RESOLVED)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              statusFilter === FeedbackStatus.RESOLVED
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Đã xử lý
          </button>
          <button
            onClick={() => setStatusFilter(FeedbackStatus.REJECTED)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              statusFilter === FeedbackStatus.REJECTED
                ? 'bg-red-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Từ chối
          </button>
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Người Gửi</th>
              <th className="px-6 py-4">Bài Thơ</th>
              <th className="px-6 py-4">Nội Dung Góp Ý</th>
              <th className="px-6 py-4">Trạng Thái</th>
              <th className="px-6 py-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  Đang tải danh sách góp ý...
                </td>
              </tr>
            ) : feedbacks.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  Chưa có góp ý nào.
                </td>
              </tr>
            ) : (
              feedbacks.map((f) => {
                const isResolved = f.status === FeedbackStatus.RESOLVED || f.status === FeedbackStatus.APPROVED || f.status === 'RESOLVED'
                const isRejected = f.status === FeedbackStatus.REJECTED || f.status === 'REJECTED'
                return (
                  <tr key={f.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">#{f.id}</td>
                    <td className="px-6 py-4 font-bold text-slate-100">{f.username || `User #${f.userId}`}</td>
                    <td className="px-6 py-4">
                      <Link to={toPoemDetail(f.poemId)} className="text-amber-400 hover:underline">
                        Bài thơ #{f.poemId}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-200 min-w-[280px]">
                      <RichContent content={f.content} />
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          isResolved
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : isRejected
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {f.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {!isResolved && (
                        <button
                          onClick={() => handleUpdateStatus(f.id, FeedbackStatus.RESOLVED)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-medium transition-colors"
                        >
                          Duyệt
                        </button>
                      )}
                      {!isRejected && (
                        <button
                          onClick={() => handleUpdateStatus(f.id, FeedbackStatus.REJECTED)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-medium transition-colors"
                        >
                          Từ chối
                        </button>
                      )}
                    <button
                      onClick={() => handleDelete(f.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-medium transition-colors"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              )
            })
          )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
