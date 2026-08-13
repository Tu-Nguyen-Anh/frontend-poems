import { useEffect, useState } from 'react'
import { poemService } from '@/services/poem.service'
import type { FacetItem } from '@/types'

/** Đường dẫn tới cấp cần lấy nhánh con. */
export interface FacetPath {
  language?: string
  era?: string
  genreId?: number
}

// Cache theo đường dẫn: cây trái và cột phải dùng chung → mở cùng một nhánh
// không gọi API hai lần. Dedup cả request đang bay.
const cache = new Map<string, FacetItem[]>()
const inflight = new Map<string, Promise<FacetItem[]>>()

function keyOf(p: FacetPath): string {
  return JSON.stringify([p.language ?? '', p.era ?? '', p.genreId ?? ''])
}

/** Lấy nhánh con của một đường dẫn (có cache). Truyền `null`/`enabled=false` để bỏ qua. */
export function useFacets(path: FacetPath | null, enabled = true) {
  const key = path && enabled ? keyOf(path) : null
  const [items, setItems] = useState<FacetItem[] | null>(
    key && cache.has(key) ? cache.get(key)! : null,
  )
  const [loading, setLoading] = useState(!!key && !cache.has(key))

  useEffect(() => {
    if (!path || !key) {
      setItems(null)
      setLoading(false)
      return
    }
    if (cache.has(key)) {
      setItems(cache.get(key)!)
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    let promise = inflight.get(key)
    if (!promise) {
      promise = poemService
        .getFacets(path)
        .then((r) => {
          cache.set(key, r)
          inflight.delete(key)
          return r
        })
        .catch((e) => {
          inflight.delete(key)
          throw e
        })
      inflight.set(key, promise)
    }
    promise
      .then((r) => alive && (setItems(r), setLoading(false)))
      .catch(() => alive && (setItems([]), setLoading(false)))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return { items, loading }
}
