import { useFetch } from '@/hooks'
import { poemService } from '@/services/poem.service'

export function usePoem(id: number | string | undefined) {
  return useFetch(async () => {
    if (!id) return null
    return poemService.getPoemById(Number(id))
  }, [id])
}
