import { useFetch } from '@/hooks'
import { userService } from '../user.service'

/** Component chỉ gọi hook này, không gọi service trực tiếp. */
export function useUsers() {
  return useFetch(() => userService.getAll())
}
