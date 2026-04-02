import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'

export default function ProtectedRoute() {
  const { user, ready } = useAuth()
  const location = useLocation()

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

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
