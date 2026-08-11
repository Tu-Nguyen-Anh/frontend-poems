import { useState } from 'react'
import { Skeleton } from '@/components/ui/Skeleton'
import { IconSearch } from '@/components/ui/icons'
import { useDebounce } from '@/hooks/useDebounce'
import { UserCard } from '../components/UserCard'
import { useUsers } from '../hooks/useUsers'

export default function UsersPage() {
  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebounce(keyword, 400)
  const { data: users, loading, error, refetch } = useUsers(debouncedKeyword)

  return (
    <div className="space-y-6 py-4">
      <div>
        <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-amber-100 mb-1">
          Danh Sách Người Dùng
        </h1>
        <p className="text-slate-500 text-sm">Cộng đồng độc giả và nhà quản trị Thi Đàn</p>
      </div>

      <div className="max-w-md relative">
        <input
          type="text"
          placeholder="Tìm tên đăng nhập người dùng..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
        />
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          <IconSearch size={16} />
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-10">
          <p className="text-rose-500 text-sm mb-3">{error}</p>
          <button
            onClick={() => void refetch()}
            className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-md transition-colors"
          >
            Thử lại
          </button>
        </div>
      ) : !users || users.length === 0 ? (
        <p className="text-slate-400 text-sm italic">Không tìm thấy người dùng nào.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {users.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      )}
    </div>
  )
}
