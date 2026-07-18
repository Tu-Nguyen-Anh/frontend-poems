export interface JwtClaims {
  sub?: string
  roles?: string[]
  exp?: number
}

/** Decode payload của JWT (không verify — chỉ dùng để đọc thông tin hiển thị). */
export function decodeJwt(token: string): JwtClaims | null {
  try {
    const payload = token.split('.')[1]
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(normalized)) as JwtClaims
  } catch {
    return null
  }
}
