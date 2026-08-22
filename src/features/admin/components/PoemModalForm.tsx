import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { AuthorSelect } from './AuthorSelect'
import type { PoemResponse, GenreResponse, PoemRequest } from '@/types'

interface PoemModalFormProps {
  isOpen: boolean
  onClose: () => void
  editingPoem: PoemResponse | null
  genres: GenreResponse[]
  onSubmit: (data: PoemRequest) => Promise<void>
}

export function PoemModalForm({
  isOpen,
  onClose,
  editingPoem,
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
      const matchingGenre = genres.find((g) => g.name === editingPoem.genreName)
      setForm({
        name: editingPoem.name || '',
        description: editingPoem.description || '',
        year: editingPoem.year,
        content: editingPoem.content || '',
        transliteration: editingPoem.transliteration || '',
        translation: editingPoem.translation || '',
        language: editingPoem.language || 'vi',
        authorId: editingPoem.authorId ?? editingPoem.author_id ?? undefined,
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
        authorId: undefined,
        genreId: genres[0]?.id,
      })
    }
  }, [editingPoem, genres, isOpen])

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
      title={editingPoem ? 'Chỉnh sửa bài thơ' : 'Thêm bài thơ mới'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-sm text-[var(--c-text)]">
        {errorMsg && (
          <div className="p-3 bg-[var(--c-danger-bg)] border border-[var(--c-border)] rounded-lg text-[var(--c-danger)] text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase text-[var(--c-muted)] mb-1">Tên bài thơ *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full p-2.5 bg-[var(--c-bg)] border border-[var(--c-border)] rounded-xl text-[var(--c-heading)] focus:ring-2 focus:ring-[var(--c-brand-tint-border)] outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-[var(--c-muted)] mb-1">Tác giả *</label>
            <AuthorSelect
              required
              value={form.authorId}
              initialLabel={editingPoem?.authorName || editingPoem?.author_name}
              onChange={(id) => setForm({ ...form, authorId: id })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-[var(--c-muted)] mb-1">Thể loại *</label>
            <select
              required
              value={form.genreId || ''}
              onChange={(e) => setForm({ ...form, genreId: Number(e.target.value) || undefined })}
              className="w-full p-2.5 bg-[var(--c-bg)] border border-[var(--c-border)] rounded-xl text-[var(--c-heading)] focus:ring-2 focus:ring-[var(--c-brand-tint-border)] outline-none"
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
            <label className="block text-xs font-bold uppercase text-[var(--c-muted)] mb-1">Năm sáng tác</label>
            <input
              type="number"
              value={form.year || ''}
              onChange={(e) => setForm({ ...form, year: Number(e.target.value) || undefined })}
              className="w-full p-2.5 bg-[var(--c-bg)] border border-[var(--c-border)] rounded-xl text-[var(--c-heading)] focus:ring-2 focus:ring-[var(--c-brand-tint-border)] outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-[var(--c-muted)] mb-1">Nội dung bài thơ *</label>
          <textarea
            rows={6}
            required
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="w-full p-3 bg-[var(--c-bg)] border border-[var(--c-border)] rounded-xl font-serif text-[var(--c-heading)] focus:ring-2 focus:ring-[var(--c-brand-tint-border)] outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-[var(--c-muted)] mb-1">Phiên âm Hán Việt (tùy chọn)</label>
          <textarea
            rows={3}
            value={form.transliteration || ''}
            onChange={(e) => setForm({ ...form, transliteration: e.target.value })}
            className="w-full p-3 bg-[var(--c-bg)] border border-[var(--c-border)] rounded-xl font-serif text-[var(--c-heading)] focus:ring-2 focus:ring-[var(--c-brand-tint-border)] outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-[var(--c-muted)] mb-1">Dịch thơ / Giải nghĩa (tùy chọn)</label>
          <textarea
            rows={3}
            value={form.translation || ''}
            onChange={(e) => setForm({ ...form, translation: e.target.value })}
            className="w-full p-3 bg-[var(--c-bg)] border border-[var(--c-border)] rounded-xl font-serif text-[var(--c-heading)] focus:ring-2 focus:ring-[var(--c-brand-tint-border)] outline-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--c-border)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[var(--c-surface-2)] hover:bg-[var(--c-surface-3)] text-[var(--c-text)] rounded-lg text-xs font-medium transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-[var(--c-gold)] hover:opacity-90 text-white font-medium text-xs rounded-lg transition-colors"
          >
            {submitting ? 'Đang lưu...' : 'Lưu bài thơ'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
