import { useCallback, useEffect, useState, type DependencyList } from 'react'
import { getErrorMessage } from '@/utils/error'

interface UseFetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

/**
 * Hook fetch data generic: tự quản lý loading / error / refetch.
 * Các feature hook (vd: useUsers) chỉ cần gọi lại hook này với fetcher riêng.
 */
export function useFetch<T>(fetcher: () => Promise<T>, deps: DependencyList = []) {
  const [state, setState] = useState<UseFetchState<T>>({
    data: null,
    loading: true,
    error: null,
  })

  const refetch = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const data = await fetcher()
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState({ data: null, loading: false, error: getErrorMessage(error) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { ...state, refetch }
}
