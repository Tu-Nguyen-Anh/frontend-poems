import { useState, type ReactNode } from 'react'
import { STORAGE_KEYS } from '@/constants'
import { authService } from '@/services/auth.service'
import { tokenStorage } from '@/services/tokenStorage'
import { decodeJwt } from '@/utils/jwt'
import { storage } from '@/utils/storage'
import { AuthContext, type AuthUser } from './auth-context'
import { UserRole } from '@/types'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => storage.get<AuthUser>(STORAGE_KEYS.USER))

  const processTokens = (tokensData: any, usernameFallback: string) => {
    const accessToken = typeof tokensData === 'string'
      ? tokensData
      : tokensData?.accessToken || tokensData?.access_token || tokensData?.token || tokensData?.data?.accessToken

    const claims = accessToken ? decodeJwt(accessToken) : null

    const rolesFromClaims: string[] = claims?.roles || (claims as any)?.authorities || (typeof (claims as any)?.scope === 'string' ? (claims as any).scope.split(' ') : [])
    const rolesFromRes: string[] = tokensData?.roles || (tokensData?.role ? [tokensData.role] : [])
    const roles: string[] = Array.from(new Set([...rolesFromClaims, ...rolesFromRes]))

    let role: string = (claims as any)?.role || tokensData?.role || roles[0] || UserRole.USER
    if (roles.some((r) => r === 'ROLE_ADMIN' || r === 'ADMIN' || r === 'admin')) {
      role = UserRole.ADMIN
    }

    const userId =
      claims?.userId ??
      (claims as any)?.user_id ??
      (claims as any)?.id ??
      tokensData?.userId ??
      tokensData?.user_id ??
      tokensData?.id ??
      tokensData?.user?.id

    const nextUser: AuthUser = {
      id: userId !== undefined && userId !== null ? Number(userId) : undefined,
      username: claims?.sub ?? (claims as any)?.username ?? tokensData?.username ?? usernameFallback,
      email: (claims as any)?.email ?? tokensData?.email ?? tokensData?.user?.email,
      phoneNumber: (claims as any)?.phoneNumber ?? (claims as any)?.phone ?? tokensData?.phoneNumber ?? tokensData?.phone ?? tokensData?.user?.phoneNumber,
      roles,
      role,
    }
    tokenStorage.saveUser(nextUser as any)
    setUser(nextUser)
  }

  const login = async (username: string, password: string) => {
    const tokens = await authService.login({ username, password })
    processTokens(tokens, username)
  }

  const loginWithGoogle = async (googleToken: string) => {
    const tokens = await authService.loginWithGoogle(googleToken)
    processTokens(tokens, 'Google User')
  }

  const register = async (username: string, email: string, password: string, phoneNumber?: string) => {
    const tokens = await authService.register({
      username,
      email,
      password,
      phoneNumber,
    })
    processTokens(tokens, username)
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
  }

  const isAdmin = Boolean(
    user?.role === UserRole.ADMIN ||
    user?.role === 'ADMIN' ||
    user?.role === 'ROLE_ADMIN' ||
    user?.roles?.includes('ADMIN') ||
    user?.roles?.includes('ROLE_ADMIN')
  )

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, isAdmin, login, loginWithGoogle, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
