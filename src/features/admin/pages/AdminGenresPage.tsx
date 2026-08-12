import { useState, useEffect } from 'react'
import { genreService } from '@/services/genre.service'
import type { GenreResponse, GenreRequest } from '@/types'
import { GenreModalForm } from '../components/GenreModalForm'
import { getErrorMessage } from '@/utils/error'
import { useToast } from '@/contexts/ToastContext'

export default function AdminGenresPage() {
  const { toast } = useToast()
  const [genres, setGenres] = useState<GenreResponse[]>([])
  const [loading, setLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGenre, setEditingGenre] = useState<GenreResponse | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await genreService.getGenres({ isAll: true })
      setGenres(res.content || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (genre?: GenreResponse) => {
    setEditingGenre(genre || null)
    setIsModalOpen(true)
  }

  const handleSave = async (data: GenreRequest) => {
    try {
      if (editingGenre) {
        await genreService.updateGenre(editingGenre.id, data)
      } else {
        await genreService.createGenre(data)
      }
      setIsModalOpen(false)
      await loadData()
    } catch (err) {
      toast(`Lỗi khi lưu thể loại: ${getErrorMessage(err)}`)
      throw err
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thể loại này?')) return
    try {
      await genreService.deleteGenre(id)
      setGenres((prev) => prev.filter((g) => g.id !== id))
    } catch (err) {
      toast(`Lỗi khi xóa thể loại: ${getErrorMessage(err)}`)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-amber-400">Quản lý thể loại</h1>
          <p className="text-slate-400 text-sm">Thêm, sửa, xóa các thể loại thơ</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-medium text-sm rounded-lg transition-colors"
        >
          + Thêm thể loại
        </button>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Tên Thể Loại</th>
              <th className="px-6 py-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                  Đang tải danh sách thể loại...
                </td>
              </tr>
            ) : genres.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                  Chưa có thể loại nào.
                </td>
              </tr>
            ) : (
              genres.map((genre) => (
                <tr key={genre.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">#{genre.id}</td>
                  <td className="px-6 py-4 font-bold text-slate-100">{genre.name}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenModal(genre)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-medium transition-colors"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(genre.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-medium transition-colors"
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

      <GenreModalForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingGenre={editingGenre}
        onSubmit={handleSave}
      />
    </div>
  )
}
