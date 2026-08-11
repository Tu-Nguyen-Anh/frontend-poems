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
      <form onSubmit={handleSubmit} className="space-y-4 text-sm text-slate-200">
        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-xs font-semibold">
            {errorMsg}
          </div>
        )}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Tên tác giả *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Năm sinh</label>
            <input
              type="number"
              value={form.birthYear || ''}
              onChange={(e) => setForm({ ...form, birthYear: Number(e.target.value) || undefined })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Quê quán</label>
            <input
              type="text"
              value={form.hometown}
              onChange={(e) => setForm({ ...form, hometown: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Thành tựu / Tiểu sử</label>
          <textarea
            rows={4}
            value={form.achievement}
            onChange={(e) => setForm({ ...form, achievement: e.target.value })}
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white font-medium text-xs rounded-lg transition-colors"
          >
            {submitting ? 'Đang lưu...' : 'Lưu tác giả'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
