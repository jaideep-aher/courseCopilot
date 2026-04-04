import { Link } from 'react-router-dom'
import PageContainer from '../../components/layout/PageContainer'
import StakeholderNav from '../../components/stakeholders/StakeholderNav'

const navItems = [
  { to: '/coordinator', label: 'University', end: true },
  { to: '/coordinator/operations', label: 'Operations' },
  { to: '/coordinator/students', label: 'Evaluations' },
  { to: '/coordinator/deadlines', label: 'Deadlines' },
  { to: '/coordinator/review-queue', label: 'Review queue' },
  { to: '/coordinator/policies', label: 'Policies' },
]

const tools = [
  { to: '/coordinator/operations', title: 'Operations', desc: 'Pipeline counts, faculty review load, approvals.', live: true },
  { to: '/coordinator/students', title: 'Evaluation log', desc: 'All stored student runs and statuses.', live: true },
  { to: '/coordinator/deadlines', title: 'Deadlines', desc: 'Set due dates for student submissions.', live: true },
  { to: '/dashboard', title: 'Data dashboard', desc: 'Dataset statistics and distribution.', live: true },
  { to: '/batch', title: 'Batch evaluation', desc: 'Evaluate many source courses against the target catalog.', live: true },
  { to: '/courses', title: 'Catalog', desc: 'Browse and search all loaded courses.', live: true },
  { to: '/catalog-match', title: 'Quick match', desc: 'Single-course match for spot checks.', live: true },
]

export default function CoordinatorHomePage() {
  return (
    <PageContainer
      title="University console"
      subtitle="Evaluation log, deadlines, faculty workflow, and live matching tools — all in one place for your team."
      breadcrumbs={[{ label: 'University' }]}
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
          <p className="cc-footnote">Track items awaiting review or policy checks. Wire this view to your queue when ready.</p>
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
