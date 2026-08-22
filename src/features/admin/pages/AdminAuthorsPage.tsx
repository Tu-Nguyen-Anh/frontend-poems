import { useState, useEffect, useCallback } from 'react'
import { authorService } from '@/services/author.service'
import type { AuthorResponse, AuthorRequest } from '@/types'
import { AuthorModalForm } from '../components/AuthorModalForm'
import { getErrorMessage } from '@/utils/error'
import { useToast } from '@/contexts/ToastContext'
import { useDebounce } from '@/hooks/useDebounce'
import { IconSearch } from '@/components/ui/icons'
import { Pagination } from '@/components/ui/Pagination'
import { PageSizeSelect } from '@/components/ui/PageSizeSelect'
import { Skeleton } from '@/components/ui/Skeleton'

export default function AdminAuthorsPage() {
  const { toast } = useToast()
  const [authors, setAuthors] = useState<AuthorResponse[]>([])
  const [totalAmount, setTotalAmount] = useState(0)

  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebounce(keyword, 300)
  const [typeFilter, setTypeFilter] = useState<'' | 'poem' | 'story'>('')

  const [page, setPage] = useState(0)
  const [size, setSize] = useState(15)
  const [loading, setLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAuthor, setEditingAuthor] = useState<AuthorResponse | null>(null)

  const loadAuthors = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authorService.getAuthors({
        keyword: debouncedKeyword.trim() || undefined,
        type: typeFilter || undefined,
        page,
        size,
      })
      setAuthors(res.content || [])
      setTotalAmount(res.amount ?? 0)
    } catch (err) {
      console.error('Lỗi tải danh sách tác giả admin:', err)
      toast(`Lỗi tải tác giả: ${getErrorMessage(err)}`)
    } finally {
      setLoading(false)
    }
  }, [debouncedKeyword, typeFilter, page, size, toast])

  useEffect(() => {
    loadAuthors()
  }, [loadAuthors])

  const totalPages = Math.ceil(totalAmount / size) || 1

  const handleOpenModal = (author?: AuthorResponse) => {
    setEditingAuthor(author || null)
    setIsModalOpen(true)
  }

  const handleSave = async (data: AuthorRequest) => {
    try {
      if (editingAuthor) {
        await authorService.updateAuthor(editingAuthor.id, data)
        toast('Cập nhật tác giả thành công!', 'success')
      } else {
        await authorService.createAuthor(data)
        toast('Thêm tác giả mới thành công!', 'success')
      }
      setIsModalOpen(false)
      await loadAuthors()
    } catch (err) {
      toast(`Lỗi khi lưu tác giả: ${getErrorMessage(err)}`)
      throw err
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tác giả này?')) return
    try {
      await authorService.deleteAuthor(id)
      toast('Đã xóa tác giả!', 'success')
      if (authors.length === 1 && page > 0) {
        setPage((p) => p - 1)
      } else {
        await loadAuthors()
      }
    } catch (err) {
      toast(`Lỗi khi xóa tác giả: ${getErrorMessage(err)}`)
    }
  }

  const handleClearFilters = () => {
    setKeyword('')
    setTypeFilter('')
    setPage(0)
  }

  const isFiltering = Boolean(keyword.trim() || typeFilter !== '')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-serif font-bold text-[var(--c-gold)]">Quản lý tác giả</h1>
            {totalAmount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--c-brand-tint)] text-[var(--c-gold)] border border-[var(--c-brand-tint-border)]">
                {totalAmount.toLocaleString('vi-VN')} tác giả
              </span>
            )}
          </div>
          <p className="text-[var(--c-muted)] text-sm mt-1">Thêm, sửa, xóa và tìm kiếm thông tin các tác giả trong hệ thống</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-5 py-2.5 bg-[var(--c-gold)] hover:opacity-90 text-white font-medium text-sm rounded-lg transition-colors shadow-sm flex items-center gap-1.5 flex-shrink-0"
        >
          <span>+</span> Thêm tác giả
        </button>
      </div>

      {/* Toolbar: Search, Filter & PageSize */}
      <div className="bg-[var(--c-surface)] p-4 rounded-xl border border-[var(--c-border)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--c-muted-2)] pointer-events-none">
              <IconSearch size={16} />
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm tác giả theo tên, quê quán..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value)
                setPage(0)
              }}
              className="w-full pl-9 pr-8 py-2 bg-[var(--c-bg)] border border-[var(--c-border)] rounded-lg text-sm text-[var(--c-heading)] placeholder-[var(--c-muted-2)] focus:outline-none focus:ring-2 focus:ring-[var(--c-brand-tint-border)] focus:border-[var(--c-gold)] transition-all"
            />
            {keyword && (
              <button
                type="button"
                onClick={() => {
                  setKeyword('')
                  setPage(0)
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--c-muted-2)] hover:text-[var(--c-text)] text-xs px-1"
                title="Xóa tìm kiếm"
              >
                ✕
              </button>
            )}
          </div>

          {/* Lọc theo Thể loại tác phẩm */}
          <div className="flex items-center gap-1 bg-[var(--c-bg)] p-1 rounded-lg border border-[var(--c-border)]">
            {([['', 'Tất cả'], ['poem', 'Có thơ'], ['story', 'Có văn']] as const).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  setTypeFilter(val)
                  setPage(0)
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  typeFilter === val
                    ? 'bg-[var(--c-gold)] text-white'
                    : 'text-[var(--c-muted)] hover:text-[var(--c-text)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {isFiltering && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs text-[var(--c-gold)] hover:text-[var(--c-gold)] underline underline-offset-2 py-1 px-2 whitespace-nowrap"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Chọn số dòng hiển thị */}
        <div className="flex items-center justify-end">
          <PageSizeSelect
            value={size}
            onChange={(newSize) => {
              setSize(newSize)
              setPage(0)
            }}
            options={[10, 15, 20, 50, 100]}
            unit="tác giả"
            variant="admin"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--c-surface)] rounded-xl border border-[var(--c-border)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--c-text)]">
            <thead className="bg-[var(--c-surface-3)] text-[var(--c-muted)] uppercase text-xs border-b border-[var(--c-border)] select-none">
              <tr>
                <th className="px-6 py-3.5 w-20">ID</th>
                <th className="px-6 py-3.5">Tên Tác Giả</th>
                <th className="px-6 py-3.5 w-28">Năm Sinh</th>
                <th className="px-6 py-3.5">Quê Quán</th>
                <th className="px-6 py-3.5">Thành Tựu / Giới Thiệu</th>
                <th className="px-6 py-3.5 text-right w-36">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--c-divider)]">
              {loading ? (
                Array.from({ length: Math.min(size, 8) }).map((_, idx) => (
                  <tr key={`skel-${idx}`} className="animate-pulse">
                    <td className="px-6 py-4"><Skeleton className="h-4 w-8 bg-[var(--c-surface-3)]" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-40 bg-[var(--c-surface-3)]" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-16 bg-[var(--c-surface-3)]" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-28 bg-[var(--c-surface-3)]" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-60 bg-[var(--c-surface-3)]" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-6 w-20 ml-auto bg-[var(--c-surface-3)]" /></td>
                  </tr>
                ))
              ) : authors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--c-muted)]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="text-base font-medium text-[var(--c-text)]">
                        {isFiltering
                          ? 'Không tìm thấy tác giả nào phù hợp.'
                          : 'Chưa có tác giả nào trong hệ thống.'}
                      </p>
                      {isFiltering && (
                        <button
                          type="button"
                          onClick={handleClearFilters}
                          className="mt-1 text-xs text-[var(--c-gold)] hover:underline"
                        >
                          Xóa bộ lọc để xem toàn bộ danh sách
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                authors.map((author) => (
                  <tr key={author.id} className="hover:bg-[var(--c-surface-2)] transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-[var(--c-muted-2)]">#{author.id}</td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-[var(--c-heading)]">{author.name}</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        {(author.poem_count ?? author.poemCount ?? 0) > 0 && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--c-brand-tint)] text-[var(--c-gold)] font-mono">
                            {(author.poem_count ?? author.poemCount)} bài thơ
                          </span>
                        )}
                        {(author.story_count ?? author.storyCount ?? 0) > 0 && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--c-success)]/10 text-[var(--c-success)] font-mono">
                            {(author.story_count ?? author.storyCount)} truyện
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-[var(--c-gold)]">
                      {author.birthYear || (author as any).birth_year || '—'}
                    </td>
                    <td className="px-6 py-4 text-[var(--c-text)]">{author.hometown || '—'}</td>
                    <td className="px-6 py-4 truncate max-w-xs text-[var(--c-muted)]">
                      {author.achievement || '—'}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenModal(author)}
                        className="px-3 py-1 bg-[var(--c-surface-2)] hover:bg-[var(--c-surface-3)] text-[var(--c-text)] rounded-md text-xs font-medium transition-colors"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(author.id)}
                        className="px-3 py-1 bg-[var(--c-gold)] hover:opacity-90 text-white rounded-md text-xs font-medium transition-colors"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
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
            itemLabel="tác giả"
            onChange={setPage}
          />
        </div>
      </div>

      <AuthorModalForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingAuthor={editingAuthor}
        onSubmit={handleSave}
      />
    </div>
  )
}

