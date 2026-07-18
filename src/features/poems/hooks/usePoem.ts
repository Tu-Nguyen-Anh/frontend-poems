import { useFetch } from '@/hooks'
import { poemService } from '../poem.service'

/** Chi tiết 1 bài viết theo id (từ URL param). */
export function usePoem(id: string | undefined) {
  return useFetch(() => poemService.getById(id!), [id])
}
