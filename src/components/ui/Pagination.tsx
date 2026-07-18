import { Button } from './Button'

interface PaginationProps {
  page: number // 0-based
  totalPages: number
  onChange: (page: number) => void
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="pagination">
      <Button variant="secondary" disabled={page === 0} onClick={() => onChange(page - 1)}>
        ← Trước
      </Button>
      <span>
        Trang {page + 1} / {totalPages}
      </span>
      <Button
        variant="secondary"
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
      >
        Sau →
      </Button>
    </div>
  )
}
