import { useState, useEffect, useCallback } from 'react'
import { userService } from '@/services/user.service'
import { UserRole, type UserResponse } from '@/types'
import { useDebounce } from '@/hooks/useDebounce'
import { IconSearch } from '@/components/ui/icons'
import { Pagination } from '@/components/ui/Pagination'
import { PageSizeSelect } from '@/components/ui/PageSizeSelect'
import { Skeleton } from '@/components/ui/Skeleton'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserResponse[]>([])
  const [totalAmount, setTotalAmount] = useState(0)

  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebounce(keyword, 300)

  const [page, setPage] = useState(0)
  const [size, setSize] = useState(15)
  const [loading, setLoading] = useState(true)

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
      if (users.length === 1 && page > 0) {
        setPage((p) => p - 1)
      } else {
        await loadUsers()
      }
    } catch (err) {
      console.error(err)
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
            <h1 className="text-3xl font-serif font-bold text-amber-400">Quản lý người dùng</h1>
            {totalAmount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                {totalAmount.toLocaleString('vi-VN')} tài khoản
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm mt-1">Danh sách và phân quyền tài khoản người dùng trên hệ thống</p>
        </div>
      </div>

      {/* Toolbar: Search & PageSize */}
      <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
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
            className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition-all"
          />
          {keyword && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs px-1"
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
              className="text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2 py-1 px-2 whitespace-nowrap"
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
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-xs border-b border-slate-800 select-none">
              <tr>
                <th className="px-6 py-3.5 w-20">ID</th>
                <th className="px-6 py-3.5">Tên Đăng Nhập</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5">Số Điện Thoại</th>
                <th className="px-6 py-3.5">Vai Trò (Role)</th>
                <th className="px-6 py-3.5 text-right w-28">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                Array.from({ length: Math.min(size, 8) }).map((_, idx) => (
                  <tr key={`skel-${idx}`} className="animate-pulse">
                    <td className="px-6 py-4"><Skeleton className="h-4 w-8 bg-slate-800" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32 bg-slate-800" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-40 bg-slate-800" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-28 bg-slate-800" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20 bg-slate-800" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-6 w-14 ml-auto bg-slate-800" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="text-base font-medium text-slate-300">
                        {isFiltering
                          ? 'Không tìm thấy tài khoản người dùng nào phù hợp.'
                          : 'Chưa có tài khoản nào.'}
                      </p>
                      {isFiltering && (
                        <button
                          type="button"
                          onClick={handleClearFilters}
                          className="mt-1 text-xs text-amber-400 hover:underline"
                        >
                          Xóa tìm kiếm để xem toàn bộ danh sách
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">#{u.id}</td>
                    <td className="px-6 py-4 font-bold text-slate-100">{u.username}</td>
                    <td className="px-6 py-4 text-slate-400">{u.email || '—'}</td>
                    <td className="px-6 py-4">
                      {getPhone(u) ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500/10 text-amber-300 font-mono text-xs border border-amber-500/20 font-semibold">
                          {getPhone(u)}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic text-xs">Chưa có SĐT</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          u.role === UserRole.ADMIN || u.role === 'ADMIN' || u.role === 'ROLE_ADMIN'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {u.role || 'USER'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="px-3 py-1 bg-red-600/90 hover:bg-red-600 text-white rounded-md text-xs font-medium transition-colors"
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

        {/* Phân trang Admin */}
        <div className="p-4 border-t border-slate-800">
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
    </div>
  )
}

