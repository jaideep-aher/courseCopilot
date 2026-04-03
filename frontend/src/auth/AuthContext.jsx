import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { findHardcodedUser } from './hardcodedUsers'
import { ROLE_META, defaultPathForRole, isValidRole, parseRoleParam } from './roles'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

const STORAGE_KEY = 'cc_session_user'

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

async function fetchProfileRow(userId) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('role, display_name, email')
    .eq('id', userId)
    .maybeSingle()
  if (error || !data) return null
  return data
}

function userFromSupabaseSession(authUser, profile) {
  const email = profile.email || authUser.email || ''
  return {
    id: authUser.id,
    username: email,
    displayName: profile.display_name || authUser.user_metadata?.full_name || email.split('@')[0] || 'User',
    role: profile.role,
    authSource: 'supabase',
  }
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (!isSupabaseConfigured || !supabase) return readStoredUser()
    return null
  })
  const [ready, setReady] = useState(() => !isSupabaseConfigured || !supabase)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    sessionStorage.removeItem(STORAGE_KEY)

    let cancelled = false

    const applySession = async (session) => {
      if (!session?.user) {
        if (!cancelled) setUser(null)
        return
      }
      const profile = await fetchProfileRow(session.user.id)
      if (cancelled) return
      if (!profile || !isValidRole(profile.role)) {
        setUser(null)
        return
      }
      setUser(userFromSupabaseSession(session.user, profile))
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      applySession(session).finally(() => {
        if (!cancelled) setReady(true)
      })
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const login = useCallback(async (username, password, roleInput) => {
    const role = parseRoleParam(roleInput)
    const trimmedUser = username.trim()
    let supabaseAuthError = null

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedUser,
        password,
      })
      supabaseAuthError = error
      if (!error && data?.user) {
        const profile = await fetchProfileRow(data.user.id)
        if (!profile) {
          await supabase.auth.signOut()
          return {
            ok: false,
            error: 'Account exists but has no profile. Complete setup on the server or contact your administrator.',
          }
        }
        if (!isValidRole(profile.role)) {
          await supabase.auth.signOut()
          return { ok: false, error: `Unknown role "${profile.role}" in profile.` }
        }
        if (profile.role !== role) {
          await supabase.auth.signOut()
          const label = ROLE_META[profile.role]?.shortLabel ?? profile.role
          return {
            ok: false,
            error: `This account is for “${label}”. Choose that portal tab above, then sign in again.`,
          }
        }
        const sessionUser = userFromSupabaseSession(data.user, profile)
        setUser(sessionUser)
        return { ok: true, role: sessionUser.role }
      }
      // Allow hardcoded demo users when Supabase env is set but email is not a cloud account
    }

    const found = findHardcodedUser(trimmedUser, password)
    if (!found) {
      const raw = supabaseAuthError?.message || 'Invalid username or password.'
      const schemaErr =
        typeof raw === 'string' &&
        raw.toLowerCase().includes('database error querying schema')
      return {
        ok: false,
        error: schemaErr
          ? 'Hosted sign-in failed: demo accounts created with SQL need a one-time fix. In Supabase → SQL Editor, run the UPDATE in supabase/migrations/005_fix_auth_users_token_columns.sql (sets empty auth token fields).'
          : raw,
      }
    }
    const allowed = found.allowedRoles
    if (allowed?.length && !allowed.includes(role)) {
      const names = allowed.map((r) => ROLE_META[r]?.shortLabel ?? r).join(', ')
      return {
        ok: false,
        error: `This account is only for: ${names}. Pick that portal above or use demo (any role).`,
      }
    }
    const session = {
      id: found.id,
      username: found.username,
      displayName: found.displayName,
      role,
      authSource: 'demo',
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    setUser(session)
    return { ok: true, role }
  }, [])

  const logout = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut()
    }
    sessionStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      ready,
      login,
      logout,
      isAuthenticated: !!user,
      role: user?.role ?? null,
      roleHomePath: user ? defaultPathForRole(user.role) : '/',
      authSource: user?.authSource ?? null,
    }),
    [user, ready, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- hook paired with provider for this feature
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
