import { useState, useEffect } from 'react'
import { userService } from '@/services/user.service'
import { UserRole, type UserResponse } from '@/types'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    try {
      const res: any = await userService.getUsers({ isAll: true })
      const list = Array.isArray(res) ? res : res?.content || res?.data || []
      setUsers(list)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

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
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-amber-400">Quản lý người dùng</h1>
        <p className="text-slate-400 text-sm">Danh sách tài khoản người dùng trên hệ thống</p>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Tên Đăng Nhập</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Số Điện Thoại</th>
              <th className="px-6 py-4">Vai Trò (Role)</th>
              <th className="px-6 py-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  Đang tải danh sách người dùng...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  Chưa có tài khoản nào.
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
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDeleteUser(u.id)}
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
    </div>
  )
}
