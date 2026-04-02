import { useMemo, useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import UserMenu from '../auth/UserMenu'
import { useAuth } from '../../auth/AuthContext'
import { ROLE_META } from '../../auth/roles'

function buildNavItems(role, roleHomePath) {
  const workbench = { to: '/workbench', label: 'All tools' }
  const resources = { to: '/resources', label: 'Resources' }

  if (role === 'student') {
    return [
      { to: roleHomePath, label: 'Student', end: true },
      { to: '/transcript', label: 'Transcript' },
      { to: '/catalog-match', label: 'Quick match' },
      { to: '/courses', label: 'Catalog' },
      workbench,
      resources,
    ]
  }
  if (role === 'professor') {
    return [
      { to: roleHomePath, label: 'Faculty', end: true },
      { to: '/match', label: 'Syllabus' },
      { to: '/courses', label: 'Catalog' },
      { to: '/catalog-match', label: 'Quick match' },
      workbench,
      resources,
    ]
  }
  // coordinator default
  return [
    { to: roleHomePath, label: 'Coordinator', end: true },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/batch', label: 'Batch' },
    { to: '/courses', label: 'Catalog' },
    { to: '/catalog-match', label: 'Quick match' },
    workbench,
    resources,
  ]
}

function linkClass(isActive) {
  const base = 'cc-nav-link'
  if (isActive) return `${base} cc-nav-link-active`
  return base
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, roleHomePath } = useAuth()
  const role = user?.role ?? 'coordinator'

  const navItems = useMemo(() => buildNavItems(role, roleHomePath), [role, roleHomePath])
  const portalTitle = ROLE_META[role]?.shortLabel ?? 'Portal'

  return (
    <header
      className="sticky top-0 z-50 border-b border-[var(--cc-separator)]"
      style={{
        background: 'rgba(255, 255, 255, 0.72)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
      }}
    >
      <div className="max-w-6xl mx-auto px-5 lg:px-8">
        <div className="flex h-[52px] items-center justify-between gap-3">
          <Link to={roleHomePath} className="flex items-center gap-2.5 shrink-0 min-w-0" title={`${portalTitle} home`}>
            <span
              className="flex h-8 w-8 items-center justify-center text-[13px] font-semibold text-white shrink-0"
              style={{
                background: 'var(--cc-accent)',
                borderRadius: '9px',
              }}
            >
              CC
            </span>
            <div className="min-w-0 hidden sm:block">
              <span className="font-semibold text-[15px] text-[var(--cc-label)] tracking-tight block leading-tight truncate">
                Course Co-Pilot
              </span>
              <span className="text-[11px] text-[var(--cc-label-secondary)] font-medium">{portalTitle}</span>
            </div>
          </Link>

          <nav className="hidden xl:flex items-center gap-1 flex-1 justify-center min-w-0 flex-wrap">
            {navItems.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => linkClass(isActive)}>
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/"
              className="hidden lg:inline-flex text-[13px] font-medium text-[var(--cc-label-secondary)] hover:text-[var(--cc-label)] px-2 py-1 rounded-full hover:bg-[var(--cc-fill)] transition-colors"
            >
              Site home
            </Link>
            <UserMenu variant="desktop" />
            <button
              type="button"
              aria-expanded={open}
              aria-label="Menu"
              onClick={() => setOpen((o) => !o)}
              className="xl:hidden flex h-10 w-10 items-center justify-center rounded-full text-[var(--cc-label)] hover:bg-[var(--cc-fill)] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {open ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {open && (
          <div className="xl:hidden border-t border-[var(--cc-separator)] py-3 pb-4">
            <Link
              to="/"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-[15px] font-medium text-[var(--cc-accent)]"
            >
              Site home
            </Link>
            <nav className="flex flex-col gap-0.5">
              {navItems.map(({ to, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) => `${linkClass(isActive)} px-4 py-3 text-[15px]`}
                >
                  {label}
                </NavLink>
              ))}
            </nav>
            <UserMenu variant="mobile" />
          </div>
        )}
      </div>
    </header>
  )
}
