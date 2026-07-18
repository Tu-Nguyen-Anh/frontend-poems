interface PaginationProps {
  page: number // 0-based
  totalPages: number
  onChange: (page: number) => void
}

/** Danh sách nút trang: đầu + cuối + cửa sổ quanh trang hiện tại, chèn '…'. */
function pageItems(current: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i)

  const wanted = [0, total - 1, current - 1, current, current + 1]
  const pages = [...new Set(wanted)].filter((p) => p >= 0 && p < total).sort((a, b) => a - b)

  const items: (number | 'gap')[] = []
  let prev = -1
  for (const p of pages) {
    if (prev !== -1 && p - prev > 1) items.push('gap')
    items.push(p)
    prev = p
  }
  return items
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const go = (next: number) => {
    onChange(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <nav className="pagination" aria-label="Phân trang">
      <button
        className="page-btn"
        disabled={page === 0}
        onClick={() => go(page - 1)}
        aria-label="Trang trước"
      >
        ←
      </button>
      {pageItems(page, totalPages).map((item, index) =>
        item === 'gap' ? (
          <span key={`gap-${index}`} className="page-gap">
            …
          </span>
        ) : (
          <button
            key={item}
            className={`page-btn ${item === page ? 'page-btn--active' : ''}`.trim()}
            aria-current={item === page ? 'page' : undefined}
            onClick={() => go(item)}
          >
            {item + 1}
          </button>
        ),
      )}
      <button
        className="page-btn"
        disabled={page >= totalPages - 1}
        onClick={() => go(page + 1)}
        aria-label="Trang sau"
      >
        →
      </button>
    </nav>
  )
}
