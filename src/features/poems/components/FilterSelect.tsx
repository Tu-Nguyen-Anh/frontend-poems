import { useEffect, useRef, useState } from 'react'

export interface FilterOption {
  value: string
  label: string
}

/**
 * Dropdown lọc tuỳ biến (thay <select> native) — để dùng được scrollbar mảnh,
 * item cuộn được, hiển thị mục đang chọn. Dùng cho Thể loại / Thời kỳ.
 */
export function FilterSelect({
  value,
  placeholder,
  options,
  onSelect,
}: {
  value: string
  placeholder: string
  options: FilterOption[]
  onSelect: (opt: FilterOption | null) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const selected = options.find((o) => o.value === value)

  const rowClass = (active: boolean) =>
    `w-full text-left px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
      active
        ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 font-medium'
        : 'text-slate-700 hover:bg-amber-50 dark:text-slate-300 dark:hover:bg-slate-800/60'
    }`

  return (
    <div ref={ref} className="relative w-full min-w-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
      >
        <span className={`truncate ${selected ? '' : 'text-slate-500 dark:text-slate-400'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className={`flex-shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="thin-scrollbar absolute z-20 mt-1 w-full max-h-72 overflow-y-auto rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg"
        >
          <li>
            <button
              type="button"
              onClick={() => {
                onSelect(null)
                setOpen(false)
              }}
              className={rowClass(value === '')}
            >
              {value === '' && <span className="text-amber-600 dark:text-amber-400">✓</span>}
              {placeholder}
            </button>
          </li>
          {options.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                onClick={() => {
                  onSelect(o)
                  setOpen(false)
                }}
                className={rowClass(o.value === value)}
              >
                {o.value === value && <span className="text-amber-600 dark:text-amber-400">✓</span>}
                <span className="truncate">{o.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
