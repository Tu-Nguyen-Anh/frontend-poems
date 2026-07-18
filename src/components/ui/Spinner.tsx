export function Spinner({ label = 'Đang tải…' }: { label?: string }) {
  return (
    <div className="spinner" role="status" aria-live="polite">
      <span className="spinner__circle" />
      <span>{label}</span>
    </div>
  )
}
