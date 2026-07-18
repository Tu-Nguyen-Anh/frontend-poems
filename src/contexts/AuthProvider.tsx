import { useState, type ReactNode } from 'react'
import { STORAGE_KEYS } from '@/constants'
import { authService } from '@/features/auth/auth.service'
import { decodeJwt } from '@/utils/jwt'
import { storage } from '@/utils/storage'
import { AuthContext, type AuthUser } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => storage.get<AuthUser>(STORAGE_KEYS.USER))

  const login = async (username: string, password: string) => {
    const tokens = await authService.login({ username, password })
    const claims = decodeJwt(tokens.access_token)
    const nextUser: AuthUser = {
      username: claims?.sub ?? username,
      roles: claims?.roles ?? [],
    }
    storage.set(STORAGE_KEYS.USER, nextUser)
    setUser(nextUser)
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
