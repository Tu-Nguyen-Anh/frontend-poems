import { createContext } from 'react'

export interface AuthUser {
  id?: number
  username: string
  /** Tên hiển thị (vd tên thật từ Google) — ưu tiên hơn username khi hiển thị */
  displayName?: string
  email?: string
  phoneNumber?: string
  role?: string
  roles?: string[]
}

export interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (u: string, p: string) => Promise<void>
  loginWithGoogle: (token: string) => Promise<void>
  register: (u: string, e: string, p: string, phone?: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)
