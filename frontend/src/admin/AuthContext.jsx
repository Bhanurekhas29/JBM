import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { adminApi } from './api.js'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.me().then((r) => setUser(r.user)).catch(() => setUser(null)).finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (u, p) => { const r = await adminApi.login(u, p); setUser(r.user) }, [])
  const logout = useCallback(async () => { try { await adminApi.logout() } finally { setUser(null) } }, [])

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}
