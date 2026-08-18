interface PaginationProps {
  page: number // 0-based
  totalPages: number
  onChange: (page: number) => void
  /** Tổng số mục — nếu truyền sẽ hiện dòng meta "N bài · trang x/y" phía trên nav */
  totalItems?: number
  /** Nhãn đơn vị cho dòng meta, mặc định "bài" */
  itemLabel?: string
  /** Kiểu giao diện: 'default' (cho client) hoặc 'admin' (giao diện dark chuyên dụng cho admin dashboard) */
  variant?: 'default' | 'admin'
  /** Số bản ghi mỗi trang (để tính chỉ số bắt đầu và kết thúc) */
  pageSize?: number
  /** Tùy chọn class bổ sung */
  className?: string
  /** Có cuộn lên đầu sau khi bấm chuyển trang không */
  scrollToTop?: boolean
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

export function Pagination({
  page,
  totalPages,
  onChange,
  totalItems,
  itemLabel = 'bài',
  variant = 'default',
  pageSize,
  className = '',
  scrollToTop = true,
}: PaginationProps) {
  const go = (next: number) => {
    if (next === page || next < 0 || next >= totalPages) return
    onChange(next)
    if (scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      const mainEl = document.querySelector('main')
      if (mainEl) {
        mainEl.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }

  if (variant === 'admin') {
    if (totalPages <= 1 && (totalItems == null || totalItems === 0)) return null

    const size = pageSize ?? 10
    const fromItem = totalItems && totalItems > 0 ? page * size + 1 : 0
    const toItem = totalItems && totalItems > 0 ? Math.min((page + 1) * size, totalItems) : 0

    return (
      <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 px-1 text-xs text-slate-400 ${className}`.trim()}>
        <div>
          {totalItems != null && totalItems > 0 ? (
            <span>
              Hiển thị <span className="font-semibold text-slate-200">{fromItem.toLocaleString('vi-VN')}</span> -{' '}
              <span className="font-semibold text-slate-200">{toItem.toLocaleString('vi-VN')}</span> trong tổng số{' '}
              <span className="font-semibold text-amber-400">{totalItems.toLocaleString('vi-VN')}</span> {itemLabel}
              <span className="text-slate-500"> (Trang {page + 1}/{totalPages})</span>
            </span>
          ) : (
            <span>
              Trang <span className="font-semibold text-slate-200">{page + 1}</span> / {totalPages}
            </span>
          )}
        </div>

        {totalPages > 1 && (
          <nav className="flex items-center gap-1 flex-wrap justify-center" aria-label="Phân trang admin">
            <button
              type="button"
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-medium text-xs"
              disabled={page === 0}
              onClick={() => go(0)}
              title="Về trang đầu"
            >
              «
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-medium text-xs"
              disabled={page === 0}
              onClick={() => go(page - 1)}
              title="Trang trước"
            >
              ‹ Trước
            </button>

            {pageItems(page, totalPages).map((item, index) =>
              item === 'gap' ? (
                <span key={`gap-${index}`} className="px-1 text-slate-600 font-bold select-none">
                  …
                </span>
              ) : (
                <button
                  type="button"
                  key={item}
                  className={`min-w-[32px] h-8 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                    item === page
                      ? 'bg-amber-600 text-white border border-amber-500 shadow-sm shadow-amber-600/30 font-bold'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                  aria-current={item === page ? 'page' : undefined}
                  onClick={() => go(item)}
                >
                  {item + 1}
                </button>
              ),
            )}

            <button
              type="button"
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-medium text-xs"
              disabled={page >= totalPages - 1}
              onClick={() => go(page + 1)}
              title="Trang sau"
            >
              Sau ›
            </button>
            <button
              type="button"
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-medium text-xs"
              disabled={page >= totalPages - 1}
              onClick={() => go(totalPages - 1)}
              title="Đến trang cuối"
            >
              »
            </button>
          </nav>
        )}
      </div>
    )
  }

  if (totalPages <= 1 && totalItems == null) return null

  return (
    <div className={className}>
      {totalItems != null && totalItems > 0 && (
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-5 mb-1.5">
          {totalItems.toLocaleString('vi-VN')} {itemLabel} · trang {page + 1}/{totalPages}
        </p>
      )}
      {totalPages > 1 && (
        <nav className="pagination" aria-label="Phân trang">
          <button
            type="button"
            className="page-btn px-3"
            disabled={page === 0}
            onClick={() => go(page - 1)}
          >
            Trước
          </button>
          {pageItems(page, totalPages).map((item, index) =>
            item === 'gap' ? (
              <span key={`gap-${index}`} className="page-gap">
                …
              </span>
            ) : (
              <button
                type="button"
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
            type="button"
            className="page-btn px-3"
            disabled={page >= totalPages - 1}
            onClick={() => go(page + 1)}
          >
            Sau
          </button>
        </nav>
      )}
    </div>
  )
}
