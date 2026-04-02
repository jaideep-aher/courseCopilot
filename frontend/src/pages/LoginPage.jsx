import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { HARDCODED_USERS, DEMO_PASSWORD } from '../auth/hardcodedUsers'
import { ROLE_IDS, ROLE_META, defaultPathForRole, parseRoleParam } from '../auth/roles'

export default function LoginPage() {
  const { login, user, ready } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const from = location.state?.from?.pathname
  const [role, setRole] = useState(() => parseRoleParam(searchParams.get('role')))
  const [username, setUsername] = useState('username')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState('')

  useEffect(() => {
    setRole(parseRoleParam(searchParams.get('role')))
  }, [searchParams])

  useEffect(() => {
    if (!ready || !user) return
    const safeFrom =
      from && from !== '/login' && !from.startsWith('/login') ? from : defaultPathForRole(user.role)
    navigate(safeFrom, { replace: true })
  }, [ready, user, navigate, from])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    const result = login(username, password, role)
    if (!result.ok) setError(result.error)
  }

  const quickSignIn = (u) => {
    setUsername(u.username)
    setPassword(DEMO_PASSWORD)
    setError('')
    const result = login(u.username, DEMO_PASSWORD, role)
    if (!result.ok) setError(result.error)
  }

  const meta = ROLE_META[role]

  if (!ready) {
    return (
      <div className="min-h-screen cc-page-bg flex items-center justify-center">
        <div
          className="w-8 h-8 rounded-full border-2 border-[var(--cc-fill)] border-t-[var(--cc-accent)] animate-spin"
          aria-hidden
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen cc-page-bg flex flex-col items-center justify-center px-5 py-16">
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-8">
          <div className="inline-flex flex-col items-center gap-4">
            <span
              className="flex h-14 w-14 items-center justify-center text-lg font-semibold text-white"
              style={{ background: 'var(--cc-accent)', borderRadius: '12px' }}
            >
              CC
            </span>
            <div>
              <h1 className="cc-title-2 font-display">Course Co-Pilot</h1>
              <p className="mt-2 cc-footnote">{meta.loginSubtitle}</p>
            </div>
          </div>
        </div>

        <div className="cc-card p-6 sm:p-8 mb-6">
          <p className="text-[13px] font-medium text-[var(--cc-label-secondary)] mb-3">Sign in as</p>
          <div className="flex flex-wrap gap-2">
            {ROLE_IDS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setRole(id)}
                className={`cc-nav-link px-4 py-2 text-[13px] ${role === id ? 'cc-nav-link-active' : ''}`}
              >
                {ROLE_META[id].shortLabel}
              </button>
            ))}
          </div>
          <p className="cc-footnote mt-3">{meta.description}</p>
        </div>

        <div className="cc-card p-8 sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="login-username" className="block text-[13px] font-medium text-[var(--cc-label-secondary)] mb-2">
                Username
              </label>
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="cc-input"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-[13px] font-medium text-[var(--cc-label-secondary)] mb-2">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="cc-input"
              />
            </div>

            {error && (
              <p
                className="text-[15px] text-[var(--cc-danger)] px-4 py-3 rounded-[var(--cc-radius-md)]"
                style={{ background: 'var(--cc-danger-bg)' }}
                role="alert"
              >
                {error}
              </p>
            )}

            <button type="submit" className="cc-btn-primary w-full">
              Sign in
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-[var(--cc-separator)]">
            <p className="text-[13px] font-medium text-[var(--cc-label)] mb-1">Demo accounts</p>
            <p className="cc-footnote mb-5">
              Password for all: <span className="font-mono text-[var(--cc-label)]">{DEMO_PASSWORD}</span>. Try{' '}
              <span className="font-mono">username</span> / <span className="font-mono">password</span>.
            </p>
            <ul className="space-y-2">
              {HARDCODED_USERS.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => quickSignIn(u)}
                    className="w-full flex items-center justify-between gap-3 rounded-[var(--cc-radius-md)] px-4 py-3.5 text-left transition-colors hover:bg-[var(--cc-fill)]"
                  >
                    <span className="font-medium text-[15px] text-[var(--cc-label)]">{u.displayName}</span>
                    <span className="text-[13px] font-mono text-[var(--cc-label-secondary)]">{u.username}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-center mt-8">
          <Link to="/" className="cc-link text-[15px]">
            Stakeholder home
          </Link>
        </p>
      </div>
    </div>
  )
}
