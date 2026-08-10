import { useContext } from 'react'
import { AuthContext, type AuthContextType } from '@/contexts/auth-context'

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth phải được dùng bên trong <AuthProvider>')
  return context
}
