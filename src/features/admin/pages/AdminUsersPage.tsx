import { useState, useEffect, useCallback } from 'react'
import { userService, type UpdateUserPayload } from '@/services/user.service'
import { UserRole, type UserResponse } from '@/types'
import { useDebounce } from '@/hooks/useDebounce'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/contexts/ToastContext'
import { getErrorMessage } from '@/utils/error'
import { IconSearch } from '@/components/ui/icons'
import { Pagination } from '@/components/ui/Pagination'
import { PageSizeSelect } from '@/components/ui/PageSizeSelect'
import { Skeleton } from '@/components/ui/Skeleton'
import { UserModalForm } from '../components/UserModalForm'

/** Username tài khoản hệ thống được bảo vệ — chỉ chính chủ mới sửa được. */
const PROTECTED_USERNAMES = ['admin', 'superadmin']
const isProtectedUser = (u: UserResponse) => PROTECTED_USERNAMES.includes((u.username || '').toLowerCase())

export default function AdminUsersPage() {
  const { user: currentUser, isAdmin } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<UserResponse[]>([])
  const [totalAmount, setTotalAmount] = useState(0)

  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebounce(keyword, 300)

  const [page, setPage] = useState(0)
  const [size, setSize] = useState(15)
  const [loading, setLoading] = useState(true)

  const [editingUser, setEditingUser] = useState<UserResponse | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Có phải chính chủ tài khoản đang xem không (so id, fallback username)
  const isSelf = (u: UserResponse) =>
    !!currentUser &&
    ((currentUser.id != null && currentUser.id === u.id) ||
      currentUser.username?.toLowerCase() === (u.username || '').toLowerCase())

  // Tài khoản bảo vệ (admin/superadmin): chỉ chính chủ sửa; user thường: admin nào cũng sửa
  const canEditUser = (u: UserResponse) => (isProtectedUser(u) ? isSelf(u) : isAdmin)
  // Không cho xoá tài khoản bảo vệ; và không tự xoá chính mình
  const canDeleteUser = (u: UserResponse) => !isProtectedUser(u) && !isSelf(u)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res: any = await userService.getUsers({
        keyword: debouncedKeyword.trim() || undefined,
        page,
        size,
      })
      const list = Array.isArray(res) ? res : res?.content || res?.data || []
      const total = typeof res?.amount === 'number' ? res.amount : (res?.totalElements ?? list.length)
      setUsers(list)
      setTotalAmount(total)
    } catch (err) {
      console.error('Lỗi tải danh sách người dùng:', err)
    } finally {
      setLoading(false)
    }
  }, [debouncedKeyword, page, size])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const totalPages = Math.ceil(totalAmount / size) || 1

  const getPhone = (u: any): string => {
    if (!u || typeof u !== 'object') return ''
    const val =
      u.phoneNumber ??
      u.phone_number ??
      u.phone ??
      u.phoneNum ??
      u.phone_num ??
      u.phonenumber ??
      u.phoneNo ??
      u.phone_no ??
      u.soDienThoai ??
      u.so_dien_thoai ??
      u.sdt ??
      u.mobile ??
      u.mobile_number ??
      u.mobileNumber ??
      u.telephone ??
      u.contact ??
      u.contactNumber ??
      u.contact_number

    if (val !== undefined && val !== null && String(val).trim() !== '') {
      return String(val).trim()
    }

    for (const key of Object.keys(u)) {
      const lower = key.toLowerCase()
      if (lower.includes('phone') || lower.includes('sdt') || lower.includes('mobile') || lower.includes('tel')) {
        const v = u[key]
        if (v !== undefined && v !== null && String(v).trim() !== '') {
          return String(v).trim()
        }
      }
    }
    return ''
  }

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Xóa tài khoản người dùng này?')) return
    try {
      await userService.deleteUser(id)
      toast('Đã xóa tài khoản!', 'success')
      if (users.length === 1 && page > 0) {
        setPage((p) => p - 1)
      } else {
        await loadUsers()
      }
    } catch (err) {
      toast(`Lỗi khi xóa tài khoản: ${getErrorMessage(err)}`)
    }
  }

  const handleOpenCreate = () => {
    setEditingUser(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (u: UserResponse) => {
    setEditingUser(u)
    setIsModalOpen(true)
  }

  const handleSaveUser = async (data: UpdateUserPayload) => {
    try {
      if (editingUser) {
        await userService.updateUser(editingUser.id, data)
        toast('Cập nhật người dùng thành công!', 'success')
      } else {
        await userService.createUser({
          username: data.username || '',
          email: data.email || '',
          password: data.password,
          phoneNumber: data.phoneNumber,
          role: data.role,
        })
        toast('Thêm người dùng mới thành công!', 'success')
      }
      setIsModalOpen(false)
      await loadUsers()
    } catch (err) {
      toast(`Lỗi khi lưu người dùng: ${getErrorMessage(err)}`)
      throw err
    }
  }

  const handleClearFilters = () => {
    setKeyword('')
    setPage(0)
  }

  const isFiltering = Boolean(keyword.trim())

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-serif font-bold text-[var(--c-gold)]">Quản lý người dùng</h1>
            {totalAmount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--c-brand-tint)] text-[var(--c-gold)] border border-[var(--c-brand-tint-border)]">
                {totalAmount.toLocaleString('vi-VN')} tài khoản
              </span>
            )}
          </div>
          <p className="text-[var(--c-muted)] text-sm mt-1">Danh sách và phân quyền tài khoản người dùng trên hệ thống</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 bg-[var(--c-gold)] hover:opacity-90 text-white font-medium text-sm rounded-lg transition-colors shadow-sm flex items-center gap-1.5 flex-shrink-0"
        >
          <span>+</span> Thêm người dùng
        </button>
      </div>

      {/* Toolbar: Search & PageSize */}
      <div className="bg-[var(--c-surface)] p-4 rounded-xl border border-[var(--c-border)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--c-muted-2)] pointer-events-none">
            <IconSearch size={16} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên đăng nhập, email..."
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setPage(0)
            }}
            className="w-full pl-9 pr-8 py-2 bg-[var(--c-bg)] border border-[var(--c-border)] rounded-lg text-sm text-[var(--c-heading)] placeholder-[var(--c-muted-2)] focus:outline-none focus:ring-2 focus:ring-[var(--c-brand-tint-border)] focus:border-[var(--c-gold)] transition-all"
          />
          {keyword && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--c-muted-2)] hover:text-[var(--c-text)] text-xs px-1"
              title="Xóa tìm kiếm"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center justify-end gap-3">
          {isFiltering && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs text-[var(--c-gold)] hover:text-[var(--c-gold)] underline underline-offset-2 py-1 px-2 whitespace-nowrap"
            >
              Xóa tìm kiếm
            </button>
          )}
          <PageSizeSelect
            value={size}
            onChange={(newSize) => {
              setSize(newSize)
              setPage(0)
            }}
            options={[10, 15, 20, 50, 100]}
            unit="tài khoản"
            variant="admin"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--c-surface)] rounded-xl border border-[var(--c-border)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--c-text)]">
            <thead className="bg-[var(--c-surface-3)] text-[var(--c-muted)] uppercase text-xs border-b border-[var(--c-border)] select-none">
              <tr>
                <th className="px-6 py-3.5 w-20">ID</th>
                <th className="px-6 py-3.5">Tên Đăng Nhập</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5">Số Điện Thoại</th>
                <th className="px-6 py-3.5">Vai Trò (Role)</th>
                <th className="px-6 py-3.5 text-right w-36">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--c-divider)]">
              {loading ? (
                Array.from({ length: Math.min(size, 8) }).map((_, idx) => (
                  <tr key={`skel-${idx}`} className="animate-pulse">
                    <td className="px-6 py-4"><Skeleton className="h-4 w-8 bg-[var(--c-surface-3)]" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32 bg-[var(--c-surface-3)]" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-40 bg-[var(--c-surface-3)]" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-28 bg-[var(--c-surface-3)]" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20 bg-[var(--c-surface-3)]" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-6 w-14 ml-auto bg-[var(--c-surface-3)]" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--c-muted)]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="text-base font-medium text-[var(--c-text)]">
                        {isFiltering
                          ? 'Không tìm thấy tài khoản người dùng nào phù hợp.'
                          : 'Chưa có tài khoản nào.'}
                      </p>
                      {isFiltering && (
                        <button
                          type="button"
                          onClick={handleClearFilters}
                          className="mt-1 text-xs text-[var(--c-gold)] hover:underline"
                        >
                          Xóa tìm kiếm để xem toàn bộ danh sách
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-[var(--c-surface-2)] transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-[var(--c-muted-2)]">#{u.id}</td>
                    <td className="px-6 py-4 font-bold text-[var(--c-heading)]">{u.username}</td>
                    <td className="px-6 py-4 text-[var(--c-muted)]">{u.email || '—'}</td>
                    <td className="px-6 py-4">
                      {getPhone(u) ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[var(--c-brand-tint)] text-[var(--c-gold)] font-mono text-xs border border-[var(--c-brand-tint-border)] font-semibold">
                          {getPhone(u)}
                        </span>
                      ) : (
                        <span className="text-[var(--c-muted-2)] italic text-xs">Chưa có SĐT</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          u.role === UserRole.ADMIN || u.role === 'ADMIN' || u.role === 'ROLE_ADMIN'
                            ? 'bg-[var(--c-brand-tint)] text-[var(--c-gold)] border border-[var(--c-brand-tint-border)]'
                            : 'bg-[var(--c-surface-2)] text-[var(--c-text)] border border-[var(--c-border)]'
                        }`}
                      >
                        {u.role || 'USER'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      {canEditUser(u) && (
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="px-3 py-1 bg-[var(--c-surface-2)] hover:bg-[var(--c-surface-3)] text-[var(--c-text)] rounded-md text-xs font-medium transition-colors"
                        >
                          Sửa
                        </button>
                      )}
                      {canDeleteUser(u) ? (
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="px-3 py-1 bg-[var(--c-gold)] hover:opacity-90 text-white rounded-md text-xs font-medium transition-colors"
                        >
                          Xóa
                        </button>
                      ) : (
                        !canEditUser(u) && (
                          <span className="text-[var(--c-muted-2)] text-xs italic" title="Tài khoản hệ thống được bảo vệ">
                            Được bảo vệ
                          </span>
                        )
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang Admin */}
        <div className="p-4 border-t border-[var(--c-border)]">
          <Pagination
            variant="admin"
            page={page}
            totalPages={totalPages}
            totalItems={totalAmount}
            pageSize={size}
            itemLabel="tài khoản"
            onChange={setPage}
          />
        </div>
      </div>

      <UserModalForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingUser={editingUser}
        canEditRole={isAdmin}
        onSubmit={handleSaveUser}
      />
    </div>
  )
}

