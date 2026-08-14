import { useState } from 'react'
import { env } from '@/config/env'
import type { AuthorResponse } from '@/types'

/** Ảnh chân dung tác giả: ưu tiên ảnh crawl trên RustFS (avatar_local), fallback
 *  URL gốc thivien (avatar_url); không có / lỗi tải → chữ cái đầu tên. */
export function AuthorAvatar({
  author,
  size = 64,
  className = '',
}: {
  author: AuthorResponse
  size?: number
  className?: string
}) {
  const [err, setErr] = useState(false)
  const avatarLocal = author.avatar_local ?? author.avatarLocal
  const url = avatarLocal
    ? `${env.AVATAR_BASE_URL}/${avatarLocal}`
    : author.avatar_url ?? author.avatarUrl

  if (url && !err) {
    return (
      <img
        src={url}
        alt={author.name}
        loading="lazy"
        onError={() => setErr(true)}
        style={{ width: size, height: size }}
        className={`rounded-full object-cover flex-shrink-0 bg-amber-100 dark:bg-amber-900/50 ${className}`}
      />
    )
  }

  return (
    <div
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      className={`rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 flex items-center justify-center font-serif font-bold flex-shrink-0 ${className}`}
    >
      {author.name.charAt(0)}
    </div>
  )
}
