import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { findHardcodedUser } from './hardcodedUsers'
import { defaultPathForRole, isValidRole, parseRoleParam } from './roles'

const STORAGE_KEY = 'cc_session_user'

const AuthContext = createContext(null)

function readStoredUser() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.id && parsed?.username) {
      if (!isValidRole(parsed.role)) {
        parsed.role = 'coordinator'
      }
      return parsed
    }
  } catch {
    sessionStorage.removeItem(STORAGE_KEY)
  }
  return null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser())

  const login = useCallback((username, password, roleInput) => {
    const role = parseRoleParam(roleInput)
    const found = findHardcodedUser(username.trim(), password)
    if (!found) {
      return { ok: false, error: 'Invalid username or password.' }
    }
    const session = {
      id: found.id,
      username: found.username,
      displayName: found.displayName,
      role,
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    setUser(session)
    return { ok: true, role }
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      ready: true,
      login,
      logout,
      isAuthenticated: !!user,
      role: user?.role ?? null,
      roleHomePath: user ? defaultPathForRole(user.role) : '/',
    }),
    [user, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- hook paired with provider for this feature
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
