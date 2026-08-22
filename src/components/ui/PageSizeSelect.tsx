interface PageSizeSelectProps {
  value: number
  onChange: (size: number) => void
  options?: number[]
  /** Nhãn đơn vị, mặc định "bài" */
  unit?: string
  /** Kiểu giao diện */
  variant?: 'default' | 'admin'
  className?: string
}

/** Ô chọn số bản ghi hiển thị mỗi trang (10 / 20 / 50 / 100). */
export function PageSizeSelect({
  value,
  onChange,
  options = [10, 20, 50, 100],
  unit = 'bài',
  variant = 'default',
  className = '',
}: PageSizeSelectProps) {
  if (variant === 'admin') {
    return (
      <label className={`flex items-center gap-2 text-xs text-[var(--c-muted)] ${className}`.trim()}>
        <span className="whitespace-nowrap">Hiển thị</span>
        <select
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-lg px-2.5 py-1.5 text-[var(--c-text)] text-xs focus:outline-none focus:ring-2 focus:ring-[var(--c-brand-tint-border)] cursor-pointer"
        >
          {options.map((o) => (
            <option key={o} value={o} className="bg-[var(--c-surface)] text-[var(--c-text)]">
              {o} {unit}/trang
            </option>
          ))}
        </select>
      </label>
    )
  }

  return (
    <label className={`flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 ${className}`.trim()}>
      <span className="whitespace-nowrap">Hiển thị</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o} {unit}
          </option>
        ))}
      </select>
    </label>
  )
}

