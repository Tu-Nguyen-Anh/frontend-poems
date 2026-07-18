import { useMemo, useState } from 'react'
import { Input, Spinner, Button } from '@/components/ui'
import { useDebounce } from '@/hooks'
import { UserCard } from '../components/UserCard'
import { useUsers } from '../hooks/useUsers'

export default function UsersPage() {
  const { data: users, loading, error, refetch } = useUsers()
  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebounce(keyword)

  const filteredUsers = useMemo(() => {
    if (!users) return []
    const query = debouncedKeyword.toLowerCase()
    return users.filter((user) => user.name.toLowerCase().includes(query))
  }, [users, debouncedKeyword])

  if (loading) return <Spinner />

  if (error) {
    return (
      <div className="page page--center">
        <p className="text-error">{error}</p>
        <Button onClick={() => void refetch()}>Thử lại</Button>
      </div>
    )
  }

  return (
    <div className="page">
      <h1>Danh sách người dùng</h1>
      <Input
        placeholder="Tìm theo tên…"
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
      />
      <div className="card-grid">
        {filteredUsers.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
      {filteredUsers.length === 0 && <p>Không tìm thấy người dùng nào.</p>}
    </div>
  )
}
