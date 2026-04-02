import { NavLink } from 'react-router-dom'

function linkClass({ isActive }) {
  const base = 'cc-nav-link px-4 py-2 text-[13px]'
  if (isActive) return `${base} cc-nav-link-active`
  return base
}

export default function StakeholderNav({ items }) {
  return (
    <nav className="flex flex-wrap gap-2 mb-10" aria-label="Section">
      {items.map(({ to, label, end }) => (
        <NavLink key={to} to={to} end={end} className={linkClass}>
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
