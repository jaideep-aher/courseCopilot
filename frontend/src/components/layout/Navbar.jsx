import { NavLink } from 'react-router-dom'
import useHealth from '../../hooks/useHealth'

const links = [
  { to: '/', label: 'Upload Transcript' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/courses', label: 'Courses' },
  { to: '/match', label: 'Match Course' },
  { to: '/batch', label: 'Batch Evaluation' },
]

export default function Navbar() {
  const { health } = useHealth()
  const isHealthy = health?.data_loaded

  return (
    <nav className="bg-slate-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <NavLink to="/" className="text-lg font-bold tracking-tight">
              Course Co-Pilot
            </NavLink>
            <div className="hidden md:flex gap-1">
              {links.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-700 text-white'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                isHealthy ? 'bg-green-400' : 'bg-red-400'
              }`}
            />
            {isHealthy
              ? `${health.source_courses + health.target_courses} courses loaded`
              : 'Backend unavailable'}
          </div>
        </div>
      </div>
    </nav>
  )
}
