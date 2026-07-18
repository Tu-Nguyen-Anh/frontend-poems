import { useFetch } from '@/hooks'
import { poemService, type PoemListParams } from '../poem.service'

export function usePoems({ keyword, genreId, page }: PoemListParams) {
  return useFetch(() => poemService.search({ keyword, genreId, page }), [keyword, genreId, page])
}
