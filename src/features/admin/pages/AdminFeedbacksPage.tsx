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
      toast('Đã cập nhật trạng thái góp ý!', 'success')
    } catch (err) {
      toast(`Lỗi khi duyệt / từ chối góp ý: ${getErrorMessage(err)}`)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa góp ý này?')) return
    try {
      await feedbackService.deleteFeedback(id)
      toast('Đã xóa góp ý!', 'success')
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
            <h1 className="text-3xl font-serif font-bold text-[var(--c-gold)]">Quản lý góp ý</h1>
            {totalAmount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--c-brand-tint)] text-[var(--c-gold)] border border-[var(--c-brand-tint-border)]">
                {totalAmount.toLocaleString('vi-VN')} góp ý
              </span>
            )}
          </div>
          <p className="text-[var(--c-muted)] text-sm mt-1">Duyệt hoặc từ chối góp ý của độc giả</p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 bg-[var(--c-surface)] p-1.5 rounded-lg border border-[var(--c-border)]">
          <button
            onClick={() => { setStatusFilter(''); setPage(0) }}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              statusFilter === '' ? 'bg-[var(--c-gold)] text-white' : 'text-[var(--c-muted)] hover:text-[var(--c-heading)]'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => { setStatusFilter(FeedbackStatus.PENDING); setPage(0) }}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              statusFilter === FeedbackStatus.PENDING
                ? 'bg-[var(--c-gold)] text-white'
                : 'text-[var(--c-muted)] hover:text-[var(--c-heading)]'
            }`}
          >
            Chờ duyệt
          </button>
          <button
            onClick={() => { setStatusFilter(FeedbackStatus.RESOLVED); setPage(0) }}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              statusFilter === FeedbackStatus.RESOLVED
                ? 'bg-[var(--c-success)] text-white'
                : 'text-[var(--c-muted)] hover:text-[var(--c-heading)]'
            }`}
          >
            Đã xử lý
          </button>
          <button
            onClick={() => { setStatusFilter(FeedbackStatus.REJECTED); setPage(0) }}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              statusFilter === FeedbackStatus.REJECTED
                ? 'bg-[var(--c-danger)] text-white'
                : 'text-[var(--c-muted)] hover:text-[var(--c-heading)]'
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

      <div className="bg-[var(--c-surface)] rounded-xl border border-[var(--c-border)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--c-text)]">
            <thead className="bg-[var(--c-surface-3)] text-[var(--c-muted)] uppercase text-xs border-b border-[var(--c-border)] select-none">
              <tr>
                <th className="px-6 py-3.5 w-20">ID</th>
                <th className="px-6 py-3.5">Người Gửi</th>
                <th className="px-6 py-3.5">Bài Thơ</th>
                <th className="px-6 py-3.5">Nội Dung Góp Ý</th>
                <th className="px-6 py-3.5">Trạng Thái</th>
                <th className="px-6 py-3.5 text-right w-36">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--c-divider)]">
              {loading ? (
                Array.from({ length: Math.min(size, 6) }).map((_, idx) => (
                  <tr key={`skel-${idx}`} className="animate-pulse">
                    <td className="px-6 py-4"><Skeleton className="h-4 w-8 bg-[var(--c-surface-3)]" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-28 bg-[var(--c-surface-3)]" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24 bg-[var(--c-surface-3)]" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-64 bg-[var(--c-surface-3)]" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-16 bg-[var(--c-surface-3)]" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-6 w-24 ml-auto bg-[var(--c-surface-3)]" /></td>
                  </tr>
                ))
              ) : feedbacks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--c-muted)]">
                    Chưa có góp ý nào.
                  </td>
                </tr>
              ) : (
                feedbacks.map((f) => {
                  const isResolved = f.status === FeedbackStatus.RESOLVED || f.status === FeedbackStatus.APPROVED || f.status === 'RESOLVED'
                  const isRejected = f.status === FeedbackStatus.REJECTED || f.status === 'REJECTED'
                  return (
                    <tr key={f.id} className="hover:bg-[var(--c-surface-2)] transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-[var(--c-muted-2)]">#{f.id}</td>
                      <td className="px-6 py-4 font-bold text-[var(--c-heading)]">{f.username || `User #${f.userId ?? f.user_id}`}</td>
                      <td className="px-6 py-4">
                        <Link to={toPoemDetail(f.poemId ?? f.poem_id ?? '')} className="text-[var(--c-gold)] hover:underline">
                          Bài thơ #{f.poemId ?? f.poem_id}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-[var(--c-text)] min-w-[280px]">
                        <RichContent content={f.content} />
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            isResolved
                              ? 'bg-[var(--c-success)]/10 text-[var(--c-success)] border border-[var(--c-border)]'
                              : isRejected
                              ? 'bg-[var(--c-danger-bg)] text-[var(--c-danger)] border border-[var(--c-border)]'
                              : 'bg-[var(--c-brand-tint)] text-[var(--c-gold)] border border-[var(--c-brand-tint-border)]'
                          }`}
                        >
                          {f.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        {!isResolved && (
                          <button
                            onClick={() => handleUpdateStatus(f.id, FeedbackStatus.RESOLVED)}
                            className="px-3 py-1 bg-[var(--c-success)] hover:opacity-90 text-white rounded-md text-xs font-medium transition-colors"
                          >
                            Duyệt
                          </button>
                        )}
                        {!isRejected && (
                          <button
                            onClick={() => handleUpdateStatus(f.id, FeedbackStatus.REJECTED)}
                            className="px-3 py-1 bg-[var(--c-surface-2)] hover:bg-[var(--c-surface-3)] text-[var(--c-text)] rounded-md text-xs font-medium transition-colors"
                          >
                            Từ chối
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(f.id)}
                          className="px-3 py-1 bg-[var(--c-gold)] hover:opacity-90 text-white rounded-md text-xs font-medium transition-colors"
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
        <div className="p-4 border-t border-[var(--c-border)]">
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

