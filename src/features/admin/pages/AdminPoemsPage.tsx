import { useState, useEffect } from 'react'
import { poemService } from '@/services/poem.service'
import { authorService } from '@/services/author.service'
import { genreService } from '@/services/genre.service'
import type { PoemResponse, AuthorResponse, GenreResponse, PoemRequest } from '@/types'
import { PoemModalForm } from '../components/PoemModalForm'
import { getErrorMessage } from '@/utils/error'

export default function AdminPoemsPage() {
  const [poems, setPoems] = useState<PoemResponse[]>([])
  const [authors, setAuthors] = useState<AuthorResponse[]>([])
  const [genres, setGenres] = useState<GenreResponse[]>([])
  const [loading, setLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPoem, setEditingPoem] = useState<PoemResponse | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [poemsRes, authorsRes, genresRes] = await Promise.all([
        poemService.getPoems({ size: 100 }),
        authorService.getAuthors({ isAll: true }),
        genreService.getGenres({ isAll: true }),
      ])
      setPoems(poemsRes.content || [])
      setAuthors(authorsRes.content || [])
      setGenres(genresRes.content || [])
    } catch (err) {
      console.error('Lỗi tải dữ liệu admin bài thơ:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (poem?: PoemResponse) => {
    setEditingPoem(poem || null)
    setIsModalOpen(true)
  }

  const handleSave = async (data: PoemRequest) => {
    try {
      if (editingPoem) {
        await poemService.updatePoem(editingPoem.id, data)
      } else {
        await poemService.createPoem(data)
      }
      setIsModalOpen(false)
      await loadData()
    } catch (err) {
      alert(`Lỗi khi lưu bài thơ: ${getErrorMessage(err)}`)
      throw err
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài thơ này?')) return
    try {
      await poemService.deletePoem(id)
      setPoems((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      alert(getErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-amber-400">Quản lý bài thơ</h1>
          <p className="text-slate-400 text-sm">Thêm, sửa, xóa các tác phẩm bài thơ trong hệ thống</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-medium text-sm rounded-lg transition-colors"
        >
          + Thêm bài thơ
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Tên Bài Thơ</th>
              <th className="px-6 py-4">Tác Giả</th>
              <th className="px-6 py-4">Thể Loại</th>
              <th className="px-6 py-4">Năm</th>
              <th className="px-6 py-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  Đang tải danh sách bài thơ...
                </td>
              </tr>
            ) : poems.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  Chưa có bài thơ nào.
                </td>
              </tr>
            ) : (
              poems.map((poem) => (
                <tr key={poem.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">#{poem.id}</td>
                  <td className="px-6 py-4 font-bold text-slate-100">{poem.name}</td>
                  <td className="px-6 py-4 text-amber-400">{poem.authorName || 'Vô danh'}</td>
                  <td className="px-6 py-4">{poem.genreName || '—'}</td>
                  <td className="px-6 py-4 font-mono text-xs">{poem.year || '—'}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenModal(poem)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-medium transition-colors"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(poem.id)}
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
