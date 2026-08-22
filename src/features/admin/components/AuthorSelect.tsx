import { useState, useEffect, useCallback, useRef } from 'react'
import { authorService } from '@/services/author.service'
import type { AuthorResponse } from '@/types'
import { useDebounce } from '@/hooks/useDebounce'
import { IconSearch } from '@/components/ui/icons'

interface AuthorSelectProps {
  /** id tác giả đang chọn */
  value?: number
  /** tên tác giả để hiển thị/khớp lại khi sửa (lúc chưa có id) */
  initialLabel?: string
  onChange: (id: number | undefined, name?: string) => void
  required?: boolean
  /** chữ hiển thị khi chưa chọn */
  placeholder?: string
  /** cho phép bỏ chọn (hiện mục "tất cả") — dùng khi làm bộ lọc */
  allowClear?: boolean
  /** chữ cho mục bỏ chọn */
  clearLabel?: string
  /** override class kích thước nút mở (mặc định hợp form; toolbar truyền class gọn hơn) */
  sizeClass?: string
}

const PAGE_SIZE = 20

/**
 * Ô chọn tác giả có tìm kiếm + tải dần (20 bản ghi/lần, cuộn để tải thêm).
 * Không nạp toàn bộ tác giả — mỗi lần chỉ lấy một trang từ backend.
 */
export function AuthorSelect({
  value,
  initialLabel,
  onChange,
  required,
  placeholder = 'Chọn tác giả',
  allowClear = false,
  clearLabel = 'Tất cả tác giả',
  sizeClass = 'p-2.5 rounded-xl',
}: AuthorSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)

  const [items, setItems] = useState<AuthorResponse[]>([])
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState(initialLabel || '')

  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const load = useCallback(
    async (pageToLoad: number, reset: boolean) => {
      setLoading(true)
      try {
        const res = await authorService.getAuthors({
          keyword: debouncedQuery.trim() || undefined,
          page: pageToLoad,
          size: PAGE_SIZE,
        })
        const list = res.content || []
        setItems((prev) => (reset ? list : [...prev, ...list]))
        setTotal(res.amount ?? 0)
        setPage(pageToLoad)
      } catch (err) {
        console.error('Lỗi tải danh sách tác giả:', err)
      } finally {
        setLoading(false)
      }
    },
    [debouncedQuery],
  )

  // Mở dropdown hoặc đổi từ khóa → nạp lại từ trang 0
  useEffect(() => {
    if (open) load(0, true)
  }, [open, debouncedQuery, load])

  // Khi sửa bài thơ: hiển thị tên sẵn có, và nếu chưa có id thì khớp theo tên để lấy id
  useEffect(() => {
    if (!initialLabel) return
    setSelectedLabel(initialLabel)
    if (value) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await authorService.getAuthors({ keyword: initialLabel.trim(), size: PAGE_SIZE })
        const match = (res.content || []).find(
          (a) => a.name.trim().toLowerCase() === initialLabel.trim().toLowerCase(),
        )
        if (!cancelled && match) onChange(match.id, match.name)
      } catch (err) {
        console.error('Lỗi khớp tác giả theo tên:', err)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLabel, value])

  // Đồng bộ khi parent bỏ chọn (vd bấm "Xóa bộ lọc") → xoá tên hiển thị
  useEffect(() => {
    if (value == null && !initialLabel) setSelectedLabel('')
  }, [value, initialLabel])

  // Đóng khi click ra ngoài
  useEffect(() => {
    if (!open) return
    const onDocMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [open])

  const hasMore = items.length < total

  const handleScroll = () => {
    const el = listRef.current
    if (!el || loading || !hasMore) return
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 60) {
      load(page + 1, false)
    }
  }

  const handlePick = (a: AuthorResponse) => {
    onChange(a.id, a.name)
    setSelectedLabel(a.name)
    setOpen(false)
    setQuery('')
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* input ẩn để bắt validate "required" của form */}
      {required && (
        <input
          tabIndex={-1}
          aria-hidden
          className="sr-only"
          required
          value={value ? String(value) : ''}
          onChange={() => {}}
        />
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 bg-[var(--c-bg)] border border-[var(--c-border)] text-left text-sm focus:ring-2 focus:ring-[var(--c-brand-tint-border)] outline-none ${sizeClass}`}
      >
        <span className={selectedLabel ? 'text-[var(--c-heading)] truncate' : 'text-[var(--c-muted-2)] truncate'}>
          {selectedLabel || placeholder}
        </span>
        <span className="text-[var(--c-muted-2)] text-xs flex-shrink-0">▾</span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-[var(--c-border)]">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--c-muted-2)] pointer-events-none">
                <IconSearch size={14} />
              </span>
              <input
                autoFocus
                type="text"
                placeholder="Tìm tác giả..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 bg-[var(--c-bg)] border border-[var(--c-border)] rounded-lg text-sm text-[var(--c-heading)] placeholder-[var(--c-muted-2)] focus:outline-none focus:ring-2 focus:ring-[var(--c-brand-tint-border)]"
              />
            </div>
          </div>

          <div ref={listRef} onScroll={handleScroll} className="max-h-60 overflow-y-auto thin-scrollbar">
            {allowClear && (
              <button
                type="button"
                onClick={() => {
                  onChange(undefined)
                  setSelectedLabel('')
                  setOpen(false)
                  setQuery('')
                }}
                className={`w-full text-left px-3 py-2 text-sm italic transition-colors hover:bg-[var(--c-surface-2)] ${
                  value == null ? 'text-[var(--c-gold)] font-semibold' : 'text-[var(--c-muted)]'
                }`}
              >
                {clearLabel}
              </button>
            )}
            {items.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => handlePick(a)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-[var(--c-surface-2)] ${
                  a.id === value ? 'bg-[var(--c-brand-tint)] text-[var(--c-gold)] font-semibold' : 'text-[var(--c-text)]'
                }`}
              >
                {a.name}
                {(a.poemCount ?? a.poem_count) != null && (
                  <span className="text-[var(--c-muted-2)] text-xs ml-1.5">({a.poemCount ?? a.poem_count} bài)</span>
                )}
              </button>
            ))}

            {loading && (
              <div className="px-3 py-2 text-xs text-[var(--c-muted)]">Đang tải...</div>
            )}
            {!loading && items.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-[var(--c-muted)]">Không tìm thấy tác giả nào.</div>
            )}
            {!loading && hasMore && (
              <div className="px-3 py-2 text-center text-[10px] text-[var(--c-muted-2)]">Cuộn để tải thêm…</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
