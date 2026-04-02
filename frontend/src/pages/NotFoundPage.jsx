import { Link } from 'react-router-dom'
import PageContainer from '../components/layout/PageContainer'
import { useAuth } from '../auth/AuthContext'

export default function NotFoundPage() {
  const { roleHomePath } = useAuth()

  return (
    <PageContainer title={null} subtitle={null}>
      <div className="cc-card max-w-md mx-auto text-center py-20 px-8">
        <p className="text-[72px] font-semibold leading-none text-[var(--cc-fill)] tracking-tight">404</p>
        <h1 className="mt-6 cc-title-2 font-display">Page not found</h1>
        <p className="mt-3 cc-footnote max-w-xs mx-auto">
          This page does not exist. Use the menu above or try one of the links below.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to={roleHomePath} className="cc-btn-primary px-8">
            My portal
          </Link>
          <Link to="/workbench" className="cc-btn-secondary px-6">
            Workbench
          </Link>
          <Link to="/" className="cc-link text-[15px] w-full sm:w-auto py-2">
            Public home
          </Link>
        </div>
      </div>
    </PageContainer>
  )
}
