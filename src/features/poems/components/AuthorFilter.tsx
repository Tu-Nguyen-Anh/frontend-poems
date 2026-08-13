import { useCallback, useEffect, useRef, useState } from 'react'
import { authorService } from '@/services/author.service'
import { useDebounce } from '@/hooks/useDebounce'
import type { AuthorResponse } from '@/types'
import type { Ref } from '@/features/browse/browseContext'

const countOf = (a: AuthorResponse) => a.poemCount ?? a.poem_count
const PAGE = 30

/**
 * Ô lọc theo tác giả: mặc định xếp theo nhiều bài nhất, cuộn xuống nạp thêm
 * (infinite scroll — duyệt hết 5k+ tác giả), hoặc gõ để tìm nhanh. Ghim tác giả
 * đang chọn lên đầu.
 */
export function AuthorFilter({
  value,
  onChange,
}: {
  value: Ref | null
  onChange: (author: Ref | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const debounced = useDebounce(query, 300)
  const [options, setOptions] = useState<AuthorResponse[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const pageRef = useRef(0)
  const boxRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  // Nạp 1 trang (reset=true khi mở/đổi từ khoá; false khi cuộn thêm).
  const fetchPage = useCallback(
    (pageN: number, reset: boolean) => {
      setLoading(true)
      const q = debounced.trim()
      const req = q
        ? authorService.getAuthors({ keyword: q, page: pageN, size: PAGE })
        : authorService.getTopAuthors({ page: pageN, size: PAGE })
      req
        .then((res) => {
          pageRef.current = pageN
          setTotal(res.amount || 0)
          setOptions((prev) => (reset ? res.content || [] : [...prev, ...(res.content || [])]))
        })
        .catch(() => reset && setOptions([]))
        .finally(() => setLoading(false))
    },
    [debounced],
  )

  useEffect(() => {
    if (!open) return
    if (listRef.current) listRef.current.scrollTop = 0
    fetchPage(0, true)
  }, [open, debounced, fetchPage])

  // Cuộn gần đáy → nạp trang kế (duyệt hết danh sách tác giả).
  const onListScroll = () => {
    const el = listRef.current
    if (!el || loading) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 48 && options.length < total) {
      fetchPage(pageRef.current + 1, false)
    }
  }

  const pick = (a: AuthorResponse) => {
    onChange({ id: a.id, label: a.name })
    setQuery('')
    setOpen(false)
  }

  // Ghim tác giả đang chọn lên đầu danh sách nếu chưa có (để mở dropdown luôn thấy).
  const displayOptions =
    value && !options.some((a) => a.id === value.id)
      ? [{ id: value.id, name: value.label } as AuthorResponse, ...options]
      : options

  return (
    <div ref={boxRef} className="relative w-full min-w-0">
      <div className="flex items-center rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-amber-500/30">
        <input
          value={open ? query : value?.label ?? ''}
          placeholder={value ? value.label : 'Lọc theo tác giả…'}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          aria-label="Lọc theo tác giả"
          className="flex-1 min-w-0 px-3 py-2 text-sm bg-transparent text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none"
        />
        {value && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              onChange(null)
              setQuery('')
            }}
            aria-label="Bỏ lọc tác giả"
            className="px-2 text-slate-400 hover:text-amber-700"
          >
            ✕
          </button>
        )}
      </div>

      {open && (
        <ul
          ref={listRef}
          onScroll={onListScroll}
          className="thin-scrollbar absolute z-20 mt-1 w-full max-h-72 overflow-y-auto rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg"
        >
          {loading && options.length === 0 && (
            <li className="px-3 py-2 text-sm text-slate-400">Đang tải…</li>
          )}
          {!loading && displayOptions.length === 0 && (
            <li className="px-3 py-2 text-sm text-slate-400">Không tìm thấy tác giả</li>
          )}
          {!debounced.trim() && displayOptions.length > 0 && (
            <li className="px-3 pt-2 pb-1 text-[11px] uppercase tracking-wide text-slate-400">
              {value ? 'Đang chọn / nhiều bài nhất' : 'Tác giả nhiều bài nhất'}
            </li>
          )}
          {displayOptions.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => pick(a)}
                className={`w-full text-left px-3 py-1.5 text-sm flex items-center justify-between gap-2 transition-colors ${
                  a.id === value?.id
                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 font-medium'
                    : 'text-slate-700 hover:bg-amber-50 dark:text-slate-300 dark:hover:bg-slate-800/60'
                }`}
              >
                <span className="truncate flex items-center gap-1.5">
                  {a.id === value?.id && <span className="text-amber-600 dark:text-amber-400">✓</span>}
                  {a.name}
                </span>
                {countOf(a) != null && (
                  <span className="text-[11px] tabular-nums text-slate-400">{countOf(a)!.toLocaleString('vi-VN')}</span>
                )}
              </button>
            </li>
          ))}
          {loading && options.length > 0 && (
            <li className="px-3 py-2 text-xs text-center text-slate-400">Đang tải thêm…</li>
          )}
        </ul>
      )}
    </div>
  )
}
