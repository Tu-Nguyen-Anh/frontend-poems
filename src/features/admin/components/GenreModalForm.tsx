import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import type { GenreResponse, GenreRequest } from '@/types'

interface GenreModalFormProps {
  isOpen: boolean
  onClose: () => void
  editingGenre: GenreResponse | null
  onSubmit: (data: GenreRequest) => Promise<void>
}

export function GenreModalForm({
  isOpen,
  onClose,
  editingGenre,
  onSubmit,
}: GenreModalFormProps) {
  const [name, setName] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setErrorMsg('')
    if (editingGenre) {
      setName(editingGenre.name || '')
    } else {
      setName('')
    }
  }, [editingGenre, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setErrorMsg('')
    setSubmitting(true)
    try {
      await onSubmit({ name: name.trim() })
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Không thể lưu thể loại')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingGenre ? '✏️ Chỉnh Sửa Thể Loại' : '✨ Thêm Thể Loại Mới'}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-sm text-slate-200">
        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-semibold">
            ⚠️ {errorMsg}
          </div>
        )}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Tên thể loại *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
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
            {submitting ? 'Đang lưu...' : 'Lưu Thể Loại'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
