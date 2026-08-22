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
      title={editingGenre ? 'Chỉnh sửa thể loại' : 'Thêm thể loại mới'}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-sm text-[var(--c-text)]">
        {errorMsg && (
          <div className="p-3 bg-[var(--c-danger-bg)] border border-[var(--c-border)] rounded-lg text-[var(--c-danger)] text-xs font-semibold">
            {errorMsg}
          </div>
        )}
        <div>
          <label className="block text-xs font-bold uppercase text-[var(--c-muted)] mb-1">Tên thể loại *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2.5 bg-[var(--c-bg)] border border-[var(--c-border)] rounded-xl text-[var(--c-heading)]"
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
            {submitting ? 'Đang lưu...' : 'Lưu thể loại'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
