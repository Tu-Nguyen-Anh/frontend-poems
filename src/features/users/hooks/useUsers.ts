import { useFetch } from '@/hooks'
import { userService } from '@/services/user.service'

export function useUsers(keyword?: string) {
  return useFetch(async () => {
    const res = await userService.getUsers({ keyword, isAll: true })
    return res.content || []
  }, [keyword])
}
