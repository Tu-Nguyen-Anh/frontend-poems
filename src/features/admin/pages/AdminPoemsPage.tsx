import { useState, useEffect, useCallback } from 'react'
import { poemService } from '@/services/poem.service'
import { authorService } from '@/services/author.service'
import { genreService } from '@/services/genre.service'
import type { PoemResponse, AuthorResponse, GenreResponse, PoemRequest } from '@/types'
import { PoemModalForm } from '../components/PoemModalForm'
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
  const [authors, setAuthors] = useState<AuthorResponse[]>([])
  const [genres, setGenres] = useState<GenreResponse[]>([])
  const [totalAmount, setTotalAmount] = useState(0)

  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebounce(keyword, 300)
  const [genreFilter, setGenreFilter] = useState<number | ''>('')

  const [page, setPage] = useState(0)
  const [size, setSize] = useState(15)
  const [loading, setLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPoem, setEditingPoem] = useState<PoemResponse | null>(null)

  // Tải danh sách tác giả & thể loại dùng cho bộ lọc và modal
  useEffect(() => {
    async function loadMeta() {
      try {
        const [authorsRes, genresRes] = await Promise.all([
          authorService.getAuthors({ isAll: true }),
          genreService.getGenres({ isAll: true }),
        ])
        setAuthors(authorsRes.content || [])
        setGenres(genresRes.content || [])
      } catch (err) {
        console.error('Lỗi tải danh mục tác giả / thể loại:', err)
      }
    }
    loadMeta()
  }, [])

  // Tải danh sách bài thơ phân trang & tìm kiếm
  const loadPoems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await poemService.getPoems({
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
  }, [debouncedKeyword, genreFilter, page, size, toast])

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
        toast('Cập nhật bài thơ thành công!')
      } else {
        await poemService.createPoem(data)
        toast('Thêm bài thơ mới thành công!')
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
      toast('Đã xóa bài thơ!')
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
    setPage(0)
  }

  const isFiltering = Boolean(keyword.trim() || genreFilter !== '')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-serif font-bold text-amber-400">Quản lý bài thơ</h1>
            {totalAmount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                {totalAmount.toLocaleString('vi-VN')} tác phẩm
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm mt-1">Thêm, sửa, xóa và tìm kiếm các tác phẩm bài thơ trong hệ thống</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-medium text-sm rounded-lg transition-colors shadow-sm flex items-center gap-1.5 flex-shrink-0"
        >
          <span>+</span> Thêm bài thơ
        </button>
      </div>

      {/* Toolbar: Search, Filter & PageSize */}
      <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
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
              className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition-all"
            />
            {keyword && (
              <button
                type="button"
                onClick={() => {
                  setKeyword('')
                  setPage(0)
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs px-1"
                title="Xóa tìm kiếm"
              >
                ✕
              </button>
            )}
          </div>

          {/* Lọc theo Thể loại */}
          <select
            value={genreFilter}
            onChange={(e) => {
              setGenreFilter(e.target.value ? Number(e.target.value) : '')
              setPage(0)
            }}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer"
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
              className="text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2 py-1 px-2 whitespace-nowrap"
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
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-xs border-b border-slate-800 select-none">
              <tr>
                <th className="px-6 py-3.5 w-20">ID</th>
                <th className="px-6 py-3.5">Tên Bài Thơ</th>
                <th className="px-6 py-3.5">Tác Giả</th>
                <th className="px-6 py-3.5">Thể Loại</th>
                <th className="px-6 py-3.5 w-24">Năm</th>
                <th className="px-6 py-3.5 text-right w-36">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                Array.from({ length: Math.min(size, 8) }).map((_, idx) => (
                  <tr key={`skel-${idx}`} className="animate-pulse">
                    <td className="px-6 py-4"><Skeleton className="h-4 w-8 bg-slate-800" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-48 bg-slate-800" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32 bg-slate-800" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24 bg-slate-800" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-12 bg-slate-800" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-6 w-20 ml-auto bg-slate-800" /></td>
                  </tr>
                ))
              ) : poems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="text-base font-medium text-slate-300">
                        {isFiltering
                          ? 'Không tìm thấy bài thơ nào phù hợp.'
                          : 'Chưa có bài thơ nào trong hệ thống.'}
                      </p>
                      {isFiltering && (
                        <button
                          type="button"
                          onClick={handleClearFilters}
                          className="mt-1 text-xs text-amber-400 hover:underline"
                        >
                          Xóa bộ lọc để xem toàn bộ danh sách
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                poems.map((poem) => (
                  <tr key={poem.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">#{poem.id}</td>
                    <td className="px-6 py-4 font-bold text-slate-100">{poem.name}</td>
                    <td className="px-6 py-4 text-amber-400">{poem.authorName || poem.author_name || 'Vô danh'}</td>
                    <td className="px-6 py-4">
                      {poem.genreName || poem.genre_name ? (
                        <span className="px-2.5 py-1 rounded-md text-xs bg-slate-800 border border-slate-700 text-slate-300">
                          {poem.genreName || poem.genre_name}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{poem.year || '—'}</td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenModal(poem)}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-medium transition-colors"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(poem.id)}
                        className="px-3 py-1 bg-red-600/90 hover:bg-red-600 text-white rounded-md text-xs font-medium transition-colors"
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
        <div className="p-4 border-t border-slate-800">
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
        authors={authors}
        genres={genres}
        onSubmit={handleSave}
      />
    </div>
  )
}

