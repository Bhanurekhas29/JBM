import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { adminApi } from './api.js'
import { useToast } from './Toast.jsx'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const toast = useToast()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.me().then((r) => setUser(r.user)).catch(() => setUser(null)).finally(() => setLoading(false))
  }, [])

  // A save that comes back "not signed in" sends the user to the sign-in page with a clear message.
  useEffect(() => {
    const onExpired = () => { setUser(null); toast.error('Your session has expired. Please sign in again.') }
    window.addEventListener('jbm:session-expired', onExpired)
    return () => window.removeEventListener('jbm:session-expired', onExpired)
  }, [toast])

  const login = useCallback(async (u, p) => { const r = await adminApi.login(u, p); setUser(r.user) }, [])
  const logout = useCallback(async () => { try { await adminApi.logout() } finally { setUser(null) } }, [])

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}
