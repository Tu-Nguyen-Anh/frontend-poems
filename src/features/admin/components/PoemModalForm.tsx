import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import type { PoemResponse, AuthorResponse, GenreResponse, PoemRequest } from '@/types'

interface PoemModalFormProps {
  isOpen: boolean
  onClose: () => void
  editingPoem: PoemResponse | null
  authors: AuthorResponse[]
  genres: GenreResponse[]
  onSubmit: (data: PoemRequest) => Promise<void>
}

export function PoemModalForm({
  isOpen,
  onClose,
  editingPoem,
  authors,
  genres,
  onSubmit,
}: PoemModalFormProps) {
  const [form, setForm] = useState<PoemRequest>({
    name: '',
    description: '',
    year: undefined,
    content: '',
    transliteration: '',
    translation: '',
    language: 'vi',
    authorId: undefined,
    genreId: undefined,
  })
  const [errorMsg, setErrorMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setErrorMsg('')
    if (editingPoem) {
      const matchingAuthor = authors.find((a) => a.name === editingPoem.authorName)
      const matchingGenre = genres.find((g) => g.name === editingPoem.genreName)
      setForm({
        name: editingPoem.name || '',
        description: editingPoem.description || '',
        year: editingPoem.year,
        content: editingPoem.content || '',
        transliteration: editingPoem.transliteration || '',
        translation: editingPoem.translation || '',
        language: editingPoem.language || 'vi',
        authorId: matchingAuthor?.id,
        genreId: matchingGenre?.id,
      })
    } else {
      setForm({
        name: '',
        description: '',
        year: new Date().getFullYear(),
        content: '',
        transliteration: '',
        translation: '',
        language: 'vi',
        authorId: authors[0]?.id,
        genreId: genres[0]?.id,
      })
    }
  }, [editingPoem, authors, genres, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSubmitting(true)
    try {
      await onSubmit(form)
    } catch (err: any) {
      console.error('Lỗi lưu bài thơ:', err)
      setErrorMsg(err?.response?.data?.message || err?.message || 'Không thể lưu bài thơ. Vui lòng kiểm tra lại dữ liệu.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingPoem ? '✏️ Chỉnh Sửa Bài Thơ' : '✨ Thêm Bài Thơ Mới'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-sm text-slate-200">
        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-semibold">
            ⚠️ {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Tên bài thơ *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-2 focus:ring-amber-500/40 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Tác giả *</label>
            <select
              required
              value={form.authorId || ''}
              onChange={(e) => setForm({ ...form, authorId: Number(e.target.value) || undefined })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-2 focus:ring-amber-500/40 outline-none"
            >
              <option value="">Chọn tác giả</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Thể loại *</label>
            <select
              required
              value={form.genreId || ''}
              onChange={(e) => setForm({ ...form, genreId: Number(e.target.value) || undefined })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-2 focus:ring-amber-500/40 outline-none"
            >
              <option value="">Chọn thể loại</option>
              {genres.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Năm sáng tác</label>
            <input
              type="number"
              value={form.year || ''}
              onChange={(e) => setForm({ ...form, year: Number(e.target.value) || undefined })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-2 focus:ring-amber-500/40 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nội dung bài thơ *</label>
          <textarea
            rows={6}
            required
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl font-serif text-slate-100 focus:ring-2 focus:ring-amber-500/40 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Phiên âm Hán Việt (tùy chọn)</label>
          <textarea
            rows={3}
            value={form.transliteration || ''}
            onChange={(e) => setForm({ ...form, transliteration: e.target.value })}
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl font-serif text-slate-100 focus:ring-2 focus:ring-amber-500/40 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Dịch thơ / Giải nghĩa (tùy chọn)</label>
          <textarea
            rows={3}
            value={form.translation || ''}
            onChange={(e) => setForm({ ...form, translation: e.target.value })}
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl font-serif text-slate-100 focus:ring-2 focus:ring-amber-500/40 outline-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow transition"
          >
            {submitting ? 'Đang lưu...' : 'Lưu Bài Thơ'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
