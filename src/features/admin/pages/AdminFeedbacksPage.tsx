import { useState, useEffect, useCallback } from 'react'
import { feedbackService } from '@/services/feedback.service'
import { FeedbackStatus, type FeedbackResponse } from '@/types'
import { Link } from 'react-router-dom'
import { toPoemDetail } from '@/routes/paths'
import { getErrorMessage } from '@/utils/error'
import { useToast } from '@/contexts/ToastContext'
import { RichContent } from '@/components/common/RichContent'
import { Pagination } from '@/components/ui/Pagination'
import { PageSizeSelect } from '@/components/ui/PageSizeSelect'
import { Skeleton } from '@/components/ui/Skeleton'

export default function AdminFeedbacksPage() {
  const { toast } = useToast()
  const [feedbacks, setFeedbacks] = useState<FeedbackResponse[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | ''>('')

  const [page, setPage] = useState(0)
  const [size, setSize] = useState(15)
  const [loading, setLoading] = useState(true)

  const loadFeedbacks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await feedbackService.getFeedbacks({
        status: statusFilter || undefined,
        page,
        size,
      })
      setFeedbacks(res.content || [])
      setTotalAmount(res.amount ?? 0)
    } catch (err) {
      console.error('Lỗi tải danh sách góp ý:', err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page, size])

  useEffect(() => {
    loadFeedbacks()
  }, [loadFeedbacks])

  const totalPages = Math.ceil(totalAmount / size) || 1

  const handleUpdateStatus = async (id: number, status: FeedbackStatus) => {
    try {
      await feedbackService.updateFeedbackStatus(id, status)
      setFeedbacks((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status } : f))
      )
      toast('Đã cập nhật trạng thái góp ý!')
    } catch (err) {
      toast(`Lỗi khi duyệt / từ chối góp ý: ${getErrorMessage(err)}`)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa góp ý này?')) return
    try {
      await feedbackService.deleteFeedback(id)
      toast('Đã xóa góp ý!')
      if (feedbacks.length === 1 && page > 0) {
        setPage((p) => p - 1)
      } else {
        await loadFeedbacks()
      }
    } catch (err) {
      toast(`Lỗi khi xóa góp ý: ${getErrorMessage(err)}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-serif font-bold text-amber-400">Quản lý góp ý</h1>
            {totalAmount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                {totalAmount.toLocaleString('vi-VN')} góp ý
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm mt-1">Duyệt hoặc từ chối góp ý của độc giả</p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-lg border border-slate-800">
          <button
            onClick={() => { setStatusFilter(''); setPage(0) }}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              statusFilter === '' ? 'bg-amber-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => { setStatusFilter(FeedbackStatus.PENDING); setPage(0) }}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              statusFilter === FeedbackStatus.PENDING
                ? 'bg-amber-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Chờ duyệt
          </button>
          <button
            onClick={() => { setStatusFilter(FeedbackStatus.RESOLVED); setPage(0) }}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              statusFilter === FeedbackStatus.RESOLVED
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Đã xử lý
          </button>
          <button
            onClick={() => { setStatusFilter(FeedbackStatus.REJECTED); setPage(0) }}
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

      {/* Toolbar: PageSize */}
      <div className="flex justify-end items-center">
        <PageSizeSelect
          value={size}
          onChange={(newSize) => {
            setSize(newSize)
            setPage(0)
          }}
          options={[10, 15, 20, 50]}
          unit="góp ý"
          variant="admin"
        />
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-xs border-b border-slate-800 select-none">
              <tr>
                <th className="px-6 py-3.5 w-20">ID</th>
                <th className="px-6 py-3.5">Người Gửi</th>
                <th className="px-6 py-3.5">Bài Thơ</th>
                <th className="px-6 py-3.5">Nội Dung Góp Ý</th>
                <th className="px-6 py-3.5">Trạng Thái</th>
                <th className="px-6 py-3.5 text-right w-36">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                Array.from({ length: Math.min(size, 6) }).map((_, idx) => (
                  <tr key={`skel-${idx}`} className="animate-pulse">
                    <td className="px-6 py-4"><Skeleton className="h-4 w-8 bg-slate-800" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-28 bg-slate-800" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24 bg-slate-800" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-64 bg-slate-800" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-16 bg-slate-800" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-6 w-24 ml-auto bg-slate-800" /></td>
                  </tr>
                ))
              ) : feedbacks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
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
                      <td className="px-6 py-4 font-bold text-slate-100">{f.username || `User #${f.userId ?? f.user_id}`}</td>
                      <td className="px-6 py-4">
                        <Link to={toPoemDetail(f.poemId ?? f.poem_id ?? '')} className="text-amber-400 hover:underline">
                          Bài thơ #{f.poemId ?? f.poem_id}
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
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
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
                          className="px-3 py-1 bg-red-600/90 hover:bg-red-600 text-white rounded-md text-xs font-medium transition-colors"
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

        {/* Phân trang Admin */}
        <div className="p-4 border-t border-slate-800">
          <Pagination
            variant="admin"
            page={page}
            totalPages={totalPages}
            totalItems={totalAmount}
            pageSize={size}
            itemLabel="góp ý"
            onChange={setPage}
          />
        </div>
      </div>
    </div>
  )
}

