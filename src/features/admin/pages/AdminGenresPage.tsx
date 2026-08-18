import { useState, useEffect, useCallback } from 'react'
import { genreService } from '@/services/genre.service'
import type { GenreResponse, GenreRequest } from '@/types'
import { GenreModalForm } from '../components/GenreModalForm'
import { getErrorMessage } from '@/utils/error'
import { useToast } from '@/contexts/ToastContext'
import { useDebounce } from '@/hooks/useDebounce'
import { IconSearch } from '@/components/ui/icons'
import { Pagination } from '@/components/ui/Pagination'
import { PageSizeSelect } from '@/components/ui/PageSizeSelect'
import { Skeleton } from '@/components/ui/Skeleton'

export default function AdminGenresPage() {
  const { toast } = useToast()
  const [genres, setGenres] = useState<GenreResponse[]>([])
  const [totalAmount, setTotalAmount] = useState(0)

  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebounce(keyword, 300)

  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [loading, setLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGenre, setEditingGenre] = useState<GenreResponse | null>(null)

  const loadGenres = useCallback(async () => {
    setLoading(true)
    try {
      const res = await genreService.getGenres({
        keyword: debouncedKeyword.trim() || undefined,
        page,
        size,
      })
      setGenres(res.content || [])
      setTotalAmount(res.amount ?? 0)
    } catch (err) {
      console.error('Lỗi tải thể loại admin:', err)
      toast(`Lỗi tải thể loại: ${getErrorMessage(err)}`)
    } finally {
      setLoading(false)
    }
  }, [debouncedKeyword, page, size, toast])

  useEffect(() => {
    loadGenres()
  }, [loadGenres])

  const totalPages = Math.ceil(totalAmount / size) || 1

  const handleOpenModal = (genre?: GenreResponse) => {
    setEditingGenre(genre || null)
    setIsModalOpen(true)
  }

  const handleSave = async (data: GenreRequest) => {
    try {
      if (editingGenre) {
        await genreService.updateGenre(editingGenre.id, data)
        toast('Cập nhật thể loại thành công!')
      } else {
        await genreService.createGenre(data)
        toast('Thêm thể loại mới thành công!')
      }
      setIsModalOpen(false)
      await loadGenres()
    } catch (err) {
      toast(`Lỗi khi lưu thể loại: ${getErrorMessage(err)}`)
      throw err
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thể loại này?')) return
    try {
      await genreService.deleteGenre(id)
      toast('Đã xóa thể loại!')
      if (genres.length === 1 && page > 0) {
        setPage((p) => p - 1)
      } else {
        await loadGenres()
      }
    } catch (err) {
      toast(`Lỗi khi xóa thể loại: ${getErrorMessage(err)}`)
    }
  }

  const handleClearFilters = () => {
    setKeyword('')
    setPage(0)
  }

  const isFiltering = Boolean(keyword.trim())

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-serif font-bold text-amber-400">Quản lý thể loại</h1>
            {totalAmount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                {totalAmount.toLocaleString('vi-VN')} thể loại
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm mt-1">Thêm, sửa, xóa và tìm kiếm các thể loại thơ trong hệ thống</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-medium text-sm rounded-lg transition-colors shadow-sm flex items-center gap-1.5 flex-shrink-0"
        >
          <span>+</span> Thêm thể loại
        </button>
      </div>

      {/* Toolbar: Search & PageSize */}
      <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            <IconSearch size={16} />
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm thể loại thơ..."
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
              onClick={handleClearFilters}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs px-1"
              title="Xóa tìm kiếm"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center justify-end gap-3">
          {isFiltering && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2 py-1 px-2 whitespace-nowrap"
            >
              Xóa tìm kiếm
            </button>
          )}
          <PageSizeSelect
            value={size}
            onChange={(newSize) => {
              setSize(newSize)
              setPage(0)
            }}
            options={[10, 20, 50]}
            unit="thể loại"
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
                <th className="px-6 py-3.5 w-24">ID</th>
                <th className="px-6 py-3.5">Tên Thể Loại</th>
                <th className="px-6 py-3.5 text-right w-36">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                Array.from({ length: Math.min(size, 5) }).map((_, idx) => (
                  <tr key={`skel-${idx}`} className="animate-pulse">
                    <td className="px-6 py-4"><Skeleton className="h-4 w-8 bg-slate-800" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-48 bg-slate-800" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-6 w-20 ml-auto bg-slate-800" /></td>
                  </tr>
                ))
              ) : genres.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="text-base font-medium text-slate-300">
                        {isFiltering
                          ? 'Không tìm thấy thể loại nào phù hợp.'
                          : 'Chưa có thể loại nào trong hệ thống.'}
                      </p>
                      {isFiltering && (
                        <button
                          type="button"
                          onClick={handleClearFilters}
                          className="mt-1 text-xs text-amber-400 hover:underline"
                        >
                          Xóa tìm kiếm để xem toàn bộ danh sách
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                genres.map((genre) => (
                  <tr key={genre.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">#{genre.id}</td>
                    <td className="px-6 py-4 font-bold text-slate-100">{genre.name}</td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenModal(genre)}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-medium transition-colors"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(genre.id)}
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
            itemLabel="thể loại"
            onChange={setPage}
          />
        </div>
      </div>

      <GenreModalForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingGenre={editingGenre}
        onSubmit={handleSave}
      />
    </div>
  )
}

