import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import * as authApi from '../api/auth.js'

const STORAGE_KEY = 'drivehub.auth'
const AuthContext = createContext(null)

function loadSession() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (saved && saved.token && saved.user) return saved
  } catch {
    /* corrupted or unavailable storage: start signed out */
  }
  return { token: null, user: null }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSession)

  const save = useCallback((next) => {
    setSession(next)
    try {
      if (next.token) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* storage unavailable: session lives in memory only */
    }
  }, [])

  const login = useCallback(
    async (username, password) => {
      const data = await authApi.login(username, password)
      save({ token: data.access, user: data.user })
    },
    [save],
  )

  const register = useCallback(
    async ({ username, email, password }) => {
      await authApi.register({ username, email, password })
      await login(username, password)
    },
    [login],
  )

  const logout = useCallback(() => save({ token: null, user: null }), [save])

  const value = useMemo(
    () => ({
      user: session.user,
      token: session.token,
      isAuthenticated: Boolean(session.token),
      isAdmin: session.user?.role === 'admin',
      login,
      register,
      logout,
    }),
    [session, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
