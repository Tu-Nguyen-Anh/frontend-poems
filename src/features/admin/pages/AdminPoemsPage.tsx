import { useState, useEffect, useCallback } from 'react'
import { poemService } from '@/services/poem.service'
import { genreService } from '@/services/genre.service'
import type { PoemResponse, GenreResponse, PoemRequest } from '@/types'
import { PoemModalForm } from '../components/PoemModalForm'
import { AuthorSelect } from '../components/AuthorSelect'
import { getErrorMessage } from '@/utils/error'
import { useToast } from '@/contexts/ToastContext'
import { useDebounce } from '@/hooks/useDebounce'
import { IconSearch } from '@/components/ui/icons'
import { Pagination } from '@/components/ui/Pagination'
import { PageSizeSelect } from '@/components/ui/PageSizeSelect'
import { Skeleton } from '@/components/ui/Skeleton'

export default function AdminPoemsPage() {
  const { toast } = useToast()
  const [poems, setPoems] = useState<PoemResponse[]>([])
  const [genres, setGenres] = useState<GenreResponse[]>([])
  const [totalAmount, setTotalAmount] = useState(0)

  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebounce(keyword, 300)
  const [genreFilter, setGenreFilter] = useState<number | ''>('')
  const [authorFilter, setAuthorFilter] = useState<number | ''>('')

  const [page, setPage] = useState(0)
  const [size, setSize] = useState(15)
  const [loading, setLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPoem, setEditingPoem] = useState<PoemResponse | null>(null)

  // Tải danh sách thể loại cho bộ lọc và modal (tác giả nạp riêng theo trang trong AuthorSelect)
  useEffect(() => {
    async function loadMeta() {
      try {
        const genresRes = await genreService.getGenres({ isAll: true })
        setGenres(genresRes.content || [])
      } catch (err) {
        console.error('Lỗi tải danh mục thể loại:', err)
      }
    }
    loadMeta()
  }, [])

  // Tải danh sách bài thơ phân trang & tìm kiếm
  const loadPoems = useCallback(async () => {
    setLoading(true)
    try {
      // Có lọc tác giả → dùng /poems/browse (endpoint /poems không nhận authorId)
      const res = authorFilter
        ? await poemService.browsePoems({
            authorId: Number(authorFilter),
            keyword: debouncedKeyword.trim() || undefined,
            genreId: genreFilter ? Number(genreFilter) : undefined,
            page,
            size,
          })
        : await poemService.getPoems({
            keyword: debouncedKeyword.trim() || undefined,
            genreId: genreFilter ? Number(genreFilter) : undefined,
            page,
            size,
          })
      setPoems(res.content || [])
      setTotalAmount(res.amount ?? 0)
    } catch (err) {
      console.error('Lỗi tải danh sách bài thơ admin:', err)
      toast(`Lỗi tải bài thơ: ${getErrorMessage(err)}`)
    } finally {
      setLoading(false)
    }
  }, [debouncedKeyword, genreFilter, authorFilter, page, size, toast])

  useEffect(() => {
    loadPoems()
  }, [loadPoems])

  const totalPages = Math.ceil(totalAmount / size) || 1

  const handleOpenModal = (poem?: PoemResponse) => {
    setEditingPoem(poem || null)
    setIsModalOpen(true)
  }

  const handleSave = async (data: PoemRequest) => {
    try {
      if (editingPoem) {
        await poemService.updatePoem(editingPoem.id, data)
        toast('Cập nhật bài thơ thành công!', 'success')
      } else {
        await poemService.createPoem(data)
        toast('Thêm bài thơ mới thành công!', 'success')
      }
      setIsModalOpen(false)
      await loadPoems()
    } catch (err) {
      toast(`Lỗi khi lưu bài thơ: ${getErrorMessage(err)}`)
      throw err
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài thơ này?')) return
    try {
      await poemService.deletePoem(id)
      toast('Đã xóa bài thơ!', 'success')
      // Nếu xóa phần tử duy nhất ở trang > 0, lùi về trang trước
      if (poems.length === 1 && page > 0) {
        setPage((p) => p - 1)
      } else {
        await loadPoems()
      }
    } catch (err) {
      toast(getErrorMessage(err))
    }
  }

  const handleClearFilters = () => {
    setKeyword('')
    setGenreFilter('')
    setAuthorFilter('')
    setPage(0)
  }

  const isFiltering = Boolean(keyword.trim() || genreFilter !== '' || authorFilter !== '')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-serif font-bold text-[var(--c-gold)]">Quản lý bài thơ</h1>
            {totalAmount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--c-brand-tint)] text-[var(--c-gold)] border border-[var(--c-brand-tint-border)]">
                {totalAmount.toLocaleString('vi-VN')} tác phẩm
              </span>
            )}
          </div>
          <p className="text-[var(--c-muted)] text-sm mt-1">Thêm, sửa, xóa và tìm kiếm các tác phẩm bài thơ trong hệ thống</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-5 py-2.5 bg-[var(--c-gold)] hover:opacity-90 text-white font-medium text-sm rounded-lg transition-colors shadow-sm flex items-center gap-1.5 flex-shrink-0"
        >
          <span>+</span> Thêm bài thơ
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
              placeholder="Tìm kiếm theo tên bài thơ, từ khóa..."
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

          {/* Lọc theo Tác giả (tìm kiếm + tải dần) */}
          <div className="w-full sm:w-56 flex-shrink-0">
            <AuthorSelect
              value={authorFilter || undefined}
              allowClear
              placeholder="Tất cả tác giả"
              clearLabel="Tất cả tác giả"
              sizeClass="px-3 py-2 rounded-lg"
              onChange={(id) => {
                setAuthorFilter(id ?? '')
                setPage(0)
              }}
            />
          </div>

          {/* Lọc theo Thể loại */}
          <select
            value={genreFilter}
            onChange={(e) => {
              setGenreFilter(e.target.value ? Number(e.target.value) : '')
              setPage(0)
            }}
            className="bg-[var(--c-bg)] border border-[var(--c-border)] rounded-lg px-3 py-2 text-sm text-[var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[var(--c-brand-tint-border)] cursor-pointer"
          >
            <option value="">Tất cả thể loại</option>
            {genres.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

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
            unit="bài"
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
                <th className="px-6 py-3.5">Tên Bài Thơ</th>
                <th className="px-6 py-3.5">Tác Giả</th>
                <th className="px-6 py-3.5">Thể Loại</th>
                <th className="px-6 py-3.5 w-24">Năm</th>
                <th className="px-6 py-3.5 text-right w-36">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--c-divider)]">
              {loading ? (
                Array.from({ length: Math.min(size, 8) }).map((_, idx) => (
                  <tr key={`skel-${idx}`} className="animate-pulse">
                    <td className="px-6 py-4"><Skeleton className="h-4 w-8 bg-[var(--c-surface-3)]" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-48 bg-[var(--c-surface-3)]" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32 bg-[var(--c-surface-3)]" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24 bg-[var(--c-surface-3)]" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-12 bg-[var(--c-surface-3)]" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-6 w-20 ml-auto bg-[var(--c-surface-3)]" /></td>
                  </tr>
                ))
              ) : poems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--c-muted)]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="text-base font-medium text-[var(--c-text)]">
                        {isFiltering
                          ? 'Không tìm thấy bài thơ nào phù hợp.'
                          : 'Chưa có bài thơ nào trong hệ thống.'}
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
                poems.map((poem) => (
                  <tr key={poem.id} className="hover:bg-[var(--c-surface-2)] transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-[var(--c-muted-2)]">#{poem.id}</td>
                    <td className="px-6 py-4 font-bold text-[var(--c-heading)]">{poem.name}</td>
                    <td className="px-6 py-4 text-[var(--c-gold)]">{poem.authorName || poem.author_name || 'Vô danh'}</td>
                    <td className="px-6 py-4">
                      {poem.genreName || poem.genre_name ? (
                        <span className="px-2.5 py-1 rounded-md text-xs bg-[var(--c-surface-2)] border border-[var(--c-border)] text-[var(--c-text)]">
                          {poem.genreName || poem.genre_name}
                        </span>
                      ) : (
                        <span className="text-[var(--c-muted-2)]">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-[var(--c-muted)]">{poem.year || '—'}</td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenModal(poem)}
                        className="px-3 py-1 bg-[var(--c-surface-2)] hover:bg-[var(--c-surface-3)] text-[var(--c-text)] rounded-md text-xs font-medium transition-colors"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(poem.id)}
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
            itemLabel="bài thơ"
            onChange={setPage}
          />
        </div>
      </div>

      {/* Modal Form */}
      <PoemModalForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingPoem={editingPoem}
        genres={genres}
        onSubmit={handleSave}
      />
    </div>
  )
}

