import { useFetch } from '@/hooks'
import { poemService, type PoemListParams } from '../poem.service'

export function usePoems({ keyword, author, genreId, page }: PoemListParams) {
  return useFetch(
    () => poemService.search({ keyword, author, genreId, page }),
    [keyword, author, genreId, page],
  )
}
