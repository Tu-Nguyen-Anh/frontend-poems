export interface JwtClaims {
  sub?: string
  userId?: number | string
  roles?: string[]
  role?: string
  authorities?: string[]
  exp?: number
  /** Có trong Google ID token (credential) */
  name?: string
  email?: string
  picture?: string
}

/** Decode payload của JWT (không verify — chỉ dùng để đọc thông tin hiển thị).
 *  Xử lý base64url thiếu padding + giải mã UTF-8 đúng (tên tiếng Việt không bị vỡ). */
export function decodeJwt(token: string): JwtClaims | null {
  try {
    const payload = token.split('.')[1]
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    )
    return JSON.parse(json) as JwtClaims
  } catch {
    return null
  }
}
