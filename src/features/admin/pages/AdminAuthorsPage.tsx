import { useState, useEffect } from 'react'
import { authorService } from '@/services/author.service'
import type { AuthorResponse, AuthorRequest } from '@/types'
import { AuthorModalForm } from '../components/AuthorModalForm'
import { getErrorMessage } from '@/utils/error'

export default function AdminAuthorsPage() {
  const [authors, setAuthors] = useState<AuthorResponse[]>([])
  const [loading, setLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAuthor, setEditingAuthor] = useState<AuthorResponse | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await authorService.getAuthors({ isAll: true })
      setAuthors(res.content || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (author?: AuthorResponse) => {
    setEditingAuthor(author || null)
    setIsModalOpen(true)
  }

  const handleSave = async (data: AuthorRequest) => {
    try {
      if (editingAuthor) {
        await authorService.updateAuthor(editingAuthor.id, data)
      } else {
        await authorService.createAuthor(data)
      }
      setIsModalOpen(false)
      await loadData()
    } catch (err) {
      alert(`Lỗi khi lưu tác giả: ${getErrorMessage(err)}`)
      throw err
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tác giả này?')) return
    try {
      await authorService.deleteAuthor(id)
      setAuthors((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      alert(`Lỗi khi xóa tác giả: ${getErrorMessage(err)}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-amber-400">Quản lý tác giả</h1>
          <p className="text-slate-400 text-sm">Thêm, sửa, xóa thông tin tác giả thi đàn</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-medium text-sm rounded-lg transition-colors"
        >
          + Thêm tác giả
        </button>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Tên Tác Giả</th>
              <th className="px-6 py-4">Năm Sinh</th>
              <th className="px-6 py-4">Quê Quán</th>
              <th className="px-6 py-4">Thành Tựu</th>
              <th className="px-6 py-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  Đang tải danh sách tác giả...
                </td>
              </tr>
            ) : authors.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  Chưa có tác giả nào.
                </td>
              </tr>
            ) : (
              authors.map((author) => (
                <tr key={author.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">#{author.id}</td>
                  <td className="px-6 py-4 font-bold text-slate-100">{author.name}</td>
                  <td className="px-6 py-4 font-mono text-xs">{author.birthYear || '—'}</td>
                  <td className="px-6 py-4">{author.hometown || '—'}</td>
                  <td className="px-6 py-4 truncate max-w-xs text-slate-400">
                    {author.achievement || '—'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenModal(author)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-medium transition-colors"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(author.id)}
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

      <AuthorModalForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingAuthor={editingAuthor}
        onSubmit={handleSave}
      />
    </div>
  )
}
