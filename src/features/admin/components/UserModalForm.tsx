import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { UserRole, type UserResponse } from '@/types'
import type { UpdateUserPayload } from '@/services/user.service'

interface UserModalFormProps {
  isOpen: boolean
  onClose: () => void
  editingUser: UserResponse | null
  /** Có được đổi vai trò không (chỉ khi người sửa là admin) */
  canEditRole?: boolean
  onSubmit: (data: UpdateUserPayload) => Promise<void>
}

const getPhone = (u: UserResponse | null): string =>
  (u?.phoneNumber ?? u?.phone_number ?? u?.phone ?? '') as string

export function UserModalForm({ isOpen, onClose, editingUser, canEditRole = true, onSubmit }: UserModalFormProps) {
  const isCreate = !editingUser
  const [form, setForm] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    role: UserRole.USER as UserRole | string,
    password: '',
  })
  const [errorMsg, setErrorMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setErrorMsg('')
    if (editingUser) {
      setForm({
        username: editingUser.username || '',
        email: editingUser.email || '',
        phoneNumber: getPhone(editingUser),
        role: editingUser.role || UserRole.USER,
        password: '',
      })
    } else {
      setForm({ username: '', email: '', phoneNumber: '', role: UserRole.USER, password: '' })
    }
  }, [editingUser, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSubmitting(true)
    try {
      const payload: UpdateUserPayload = {
        username: form.username.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
      }
      if (canEditRole) payload.role = form.role
      // Tạo mới: bắt buộc password. Sửa: chỉ gửi khi có nhập (không reset mật khẩu).
      if (isCreate || form.password.trim()) payload.password = form.password.trim()
      await onSubmit(payload)
    } catch (err: any) {
      console.error('Lỗi lưu người dùng:', err)
      setErrorMsg(err?.response?.data?.message || err?.message || 'Không thể lưu người dùng. Vui lòng kiểm tra lại.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isCreate ? 'Thêm người dùng mới' : 'Chỉnh sửa người dùng'} maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4 text-sm text-[var(--c-text)]">
        {errorMsg && (
          <div className="p-3 bg-[var(--c-danger-bg)] border border-[var(--c-border)] rounded-lg text-[var(--c-danger)] text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase text-[var(--c-muted)] mb-1">Tên đăng nhập *</label>
          <input
            type="text"
            required
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full p-2.5 bg-[var(--c-bg)] border border-[var(--c-border)] rounded-xl text-[var(--c-heading)] focus:ring-2 focus:ring-[var(--c-brand-tint-border)] outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-[var(--c-muted)] mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full p-2.5 bg-[var(--c-bg)] border border-[var(--c-border)] rounded-xl text-[var(--c-heading)] focus:ring-2 focus:ring-[var(--c-brand-tint-border)] outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-[var(--c-muted)] mb-1">Số điện thoại</label>
          <input
            type="text"
            value={form.phoneNumber}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
            className="w-full p-2.5 bg-[var(--c-bg)] border border-[var(--c-border)] rounded-xl text-[var(--c-heading)] focus:ring-2 focus:ring-[var(--c-brand-tint-border)] outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-[var(--c-muted)] mb-1">Vai trò</label>
          <select
            value={form.role}
            disabled={!canEditRole}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full p-2.5 bg-[var(--c-bg)] border border-[var(--c-border)] rounded-xl text-[var(--c-heading)] focus:ring-2 focus:ring-[var(--c-brand-tint-border)] outline-none disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option value={UserRole.USER}>USER</option>
            <option value={UserRole.ADMIN}>ADMIN</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-[var(--c-muted)] mb-1">
            {isCreate ? 'Mật khẩu *' : 'Mật khẩu mới'}{' '}
            <span className="font-normal normal-case text-[var(--c-muted-2)]">
              {isCreate ? '(tối thiểu 8 ký tự)' : '(bỏ trống nếu không đổi)'}
            </span>
          </label>
          <input
            type="password"
            autoComplete="new-password"
            required={isCreate}
            minLength={8}
            value={form.password}
            placeholder="••••••••"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full p-2.5 bg-[var(--c-bg)] border border-[var(--c-border)] rounded-xl text-[var(--c-heading)] placeholder-[var(--c-muted-2)] focus:ring-2 focus:ring-[var(--c-brand-tint-border)] outline-none"
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
            {submitting ? 'Đang lưu...' : isCreate ? 'Thêm người dùng' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
