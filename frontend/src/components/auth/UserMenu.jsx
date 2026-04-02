import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { ROLE_META } from '../../auth/roles'

export default function UserMenu({ variant = 'desktop' }) {
  const { user, logout } = useAuth()
  const roleLabel = user?.role ? ROLE_META[user.role]?.shortLabel : ''
  const navigate = useNavigate()

  if (!user) return null

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  if (variant === 'mobile') {
    return (
      <div className="mt-2 pt-4 border-t border-[var(--cc-separator)] px-1">
        <p className="text-[13px] text-[var(--cc-label-secondary)] mb-1">Signed in · {roleLabel}</p>
        <p className="text-[15px] font-medium text-[var(--cc-label)]">{user.displayName}</p>
        <p className="text-[13px] font-mono text-[var(--cc-label-secondary)] mb-4">{user.username}</p>
        <button type="button" onClick={handleLogout} className="cc-btn-secondary w-full">
          Sign out
        </button>
      </div>
    )
  }

  return (
    <div className="hidden xl:flex items-center gap-3 shrink-0 pl-3 ml-1 border-l border-[var(--cc-separator)]">
      <div className="text-right max-w-[160px]">
        <p className="text-[10px] font-medium text-[var(--cc-label-secondary)] uppercase tracking-wide">{roleLabel}</p>
        <p className="text-[13px] font-medium text-[var(--cc-label)] truncate">{user.displayName}</p>
        <p className="text-[11px] font-mono text-[var(--cc-label-secondary)] truncate">{user.username}</p>
      </div>
      <button type="button" onClick={handleLogout} className="cc-btn-secondary !min-h-9 !px-4 !text-[13px]">
        Sign out
      </button>
    </div>
  )
}
