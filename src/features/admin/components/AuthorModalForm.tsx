import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import type { AuthorResponse, AuthorRequest } from '@/types'

interface AuthorModalFormProps {
  isOpen: boolean
  onClose: () => void
  editingAuthor: AuthorResponse | null
  onSubmit: (data: AuthorRequest) => Promise<void>
}

export function AuthorModalForm({
  isOpen,
  onClose,
  editingAuthor,
  onSubmit,
}: AuthorModalFormProps) {
  const [form, setForm] = useState<AuthorRequest>({
    name: '',
    birthYear: undefined,
    hometown: '',
    achievement: '',
  })
  const [errorMsg, setErrorMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setErrorMsg('')
    if (editingAuthor) {
      setForm({
        name: editingAuthor.name || '',
        birthYear: editingAuthor.birthYear,
        hometown: editingAuthor.hometown || '',
        achievement: editingAuthor.achievement || '',
      })
    } else {
      setForm({
        name: '',
        birthYear: undefined,
        hometown: '',
        achievement: '',
      })
    }
  }, [editingAuthor, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSubmitting(true)
    try {
      await onSubmit(form)
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Không thể lưu tác giả')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingAuthor ? 'Chỉnh sửa tác giả' : 'Thêm tác giả mới'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-sm text-[var(--c-text)]">
        {errorMsg && (
          <div className="p-3 bg-[var(--c-danger-bg)] border border-[var(--c-border)] rounded-lg text-[var(--c-danger)] text-xs font-semibold">
            {errorMsg}
          </div>
        )}
        <div>
          <label className="block text-xs font-bold uppercase text-[var(--c-muted)] mb-1">Tên tác giả *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full p-2.5 bg-[var(--c-bg)] border border-[var(--c-border)] rounded-xl text-[var(--c-heading)]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-[var(--c-muted)] mb-1">Năm sinh</label>
            <input
              type="number"
              value={form.birthYear || ''}
              onChange={(e) => setForm({ ...form, birthYear: Number(e.target.value) || undefined })}
              className="w-full p-2.5 bg-[var(--c-bg)] border border-[var(--c-border)] rounded-xl text-[var(--c-heading)]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-[var(--c-muted)] mb-1">Quê quán</label>
            <input
              type="text"
              value={form.hometown}
              onChange={(e) => setForm({ ...form, hometown: e.target.value })}
              className="w-full p-2.5 bg-[var(--c-bg)] border border-[var(--c-border)] rounded-xl text-[var(--c-heading)]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-[var(--c-muted)] mb-1">Thành tựu / Tiểu sử</label>
          <textarea
            rows={4}
            value={form.achievement}
            onChange={(e) => setForm({ ...form, achievement: e.target.value })}
            className="w-full p-3 bg-[var(--c-bg)] border border-[var(--c-border)] rounded-xl text-[var(--c-heading)]"
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
            {submitting ? 'Đang lưu...' : 'Lưu tác giả'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
