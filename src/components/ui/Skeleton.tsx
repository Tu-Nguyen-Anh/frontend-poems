import type { CSSProperties } from 'react'

/** Khối shimmer placeholder khi đang tải — kích thước truyền qua style. */
export function Skeleton({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <span className={`skeleton ${className}`.trim()} style={style} aria-hidden="true" />
}
