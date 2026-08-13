import { useEffect, useRef, useState } from 'react'
import { authorService } from '@/services/author.service'
import { useDebounce } from '@/hooks/useDebounce'
import type { AuthorResponse } from '@/types'
import type { Ref } from '@/features/browse/browseContext'

const countOf = (a: AuthorResponse) => a.poemCount ?? a.poem_count

/**
 * Ô lọc theo tác giả: mặc định gợi ý 10 tác giả nhiều bài nhất; gõ để tìm thêm
 * (server-side, giới hạn 10 kết quả). Chọn 1 tác giả → lọc danh sách bài.
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
  const [loading, setLoading] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  // Mở + rỗng → top 10; có từ khoá → tìm (size 10, không cho quá lớn).
  useEffect(() => {
    if (!open) return
    let alive = true
    setLoading(true)
    const q = debounced.trim()
    const req = q
      ? authorService.getAuthors({ keyword: q, size: 10 })
      : authorService.getTopAuthors({ size: 10 })
    req
      .then((res) => alive && (setOptions(res.content || []), setLoading(false)))
      .catch(() => alive && (setOptions([]), setLoading(false)))
    return () => {
      alive = false
    }
  }, [open, debounced])

  const pick = (a: AuthorResponse) => {
    onChange({ id: a.id, label: a.name })
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={boxRef} className="relative w-full md:w-52">
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
        <ul className="thin-scrollbar absolute z-20 mt-1 w-full max-h-72 overflow-y-auto rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
          {loading && <li className="px-3 py-2 text-sm text-slate-400">Đang tải…</li>}
          {!loading && options.length === 0 && (
            <li className="px-3 py-2 text-sm text-slate-400">Không tìm thấy tác giả</li>
          )}
          {!loading && !debounced.trim() && options.length > 0 && (
            <li className="px-3 pt-2 pb-1 text-[11px] uppercase tracking-wide text-slate-400">
              Tác giả nhiều bài nhất
            </li>
          )}
          {options.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => pick(a)}
                className={`w-full text-left px-3 py-1.5 text-sm flex items-center justify-between gap-2 transition-colors ${
                  a.id === value?.id
                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200'
                    : 'text-slate-700 hover:bg-amber-50 dark:text-slate-300 dark:hover:bg-slate-800/60'
                }`}
              >
                <span className="truncate">{a.name}</span>
                {countOf(a) != null && (
                  <span className="text-[11px] tabular-nums text-slate-400">{countOf(a)!.toLocaleString('vi-VN')}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
