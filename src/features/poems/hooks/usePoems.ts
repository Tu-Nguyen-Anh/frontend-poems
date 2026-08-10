import { useFetch } from '@/hooks'
import { poemService } from '@/services/poem.service'

export interface PoemListParams {
  keyword?: string
  page?: number
  size?: number
}

export function usePoems(params?: PoemListParams) {
  return useFetch(
    () => poemService.getPoems(params),
    [params?.keyword, params?.page, params?.size],
  )
}
