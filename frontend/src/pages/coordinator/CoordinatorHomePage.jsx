import { Link } from 'react-router-dom'
import PageContainer from '../../components/layout/PageContainer'
import StakeholderNav from '../../components/stakeholders/StakeholderNav'

const navItems = [
  { to: '/coordinator', label: 'Overview', end: true },
  { to: '/coordinator/review-queue', label: 'Review queue' },
  { to: '/coordinator/policies', label: 'Policies' },
]

const tools = [
  { to: '/dashboard', title: 'Dashboard', desc: 'Dataset statistics and distribution.', live: true },
  { to: '/batch', title: 'Batch evaluation', desc: 'Evaluate many source courses against the target catalog.', live: true },
  { to: '/courses', title: 'Catalog', desc: 'Browse and search all loaded courses.', live: true },
  { to: '/catalog-match', title: 'Quick match', desc: 'Single-course match for spot checks.', live: true },
]

export default function CoordinatorHomePage() {
  return (
    <PageContainer
      title="Coordinator console"
      subtitle="Operational tools for transfer articulation teams. Live items use your running API; queue and policy pages are static until Supabase and workflows are connected."
      breadcrumbs={[{ label: 'Coordinator' }]}
    >
      <StakeholderNav items={navItems} />

      <div className="grid sm:grid-cols-2 gap-4 mb-12">
        {tools.map(({ to, title, desc, live }) => (
          <Link
            key={to}
            to={to}
            className="cc-card p-6 flex flex-col hover:shadow-[var(--cc-shadow-card-hover)] transition-shadow"
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="cc-title-3 font-display">{title}</h3>
              {live && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#34c759]">Live</span>
              )}
            </div>
            <p className="cc-footnote leading-relaxed flex-1">{desc}</p>
            <span className="mt-4 text-[15px] font-medium text-[var(--cc-accent)]">Open →</span>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Link
          to="/coordinator/review-queue"
          className="cc-card p-6 border-dashed hover:border-[var(--cc-accent)] transition-colors"
          style={{ borderStyle: 'dashed' }}
        >
          <h3 className="cc-title-3 font-display mb-2">Review queue</h3>
          <p className="cc-footnote">Placeholder list for pending cases — will sync from Supabase later.</p>
          <span className="mt-4 inline-block text-[15px] font-medium text-[var(--cc-accent)]">View queue →</span>
        </Link>
        <Link
          to="/coordinator/policies"
          className="cc-card p-6 border-dashed hover:border-[var(--cc-accent)] transition-colors"
          style={{ borderStyle: 'dashed' }}
        >
          <h3 className="cc-title-3 font-display mb-2">Policies & notes</h3>
          <p className="cc-footnote">Static reference for your team until CMS or DB-backed content ships.</p>
          <span className="mt-4 inline-block text-[15px] font-medium text-[var(--cc-accent)]">Read policies →</span>
        </Link>
      </div>
    </PageContainer>
  )
}
