import { Link } from 'react-router-dom'
import PageContainer from '../../components/layout/PageContainer'
import StakeholderNav from '../../components/stakeholders/StakeholderNav'

const navItems = [
  { to: '/professor', label: 'Faculty', end: true },
  { to: '/professor/reviews', label: 'Evaluation reviews' },
  { to: '/professor/syllabus-tips', label: 'Syllabus tips' },
  { to: '/professor/contact-coordinator', label: 'Contact' },
]

const tips = [
  'Custom syllabus match is for courses not represented in the CSV — keep target university spelling aligned with the dataset.',
  'Quick match and catalog use faculty-only URLs; students and university evaluators have their own portals.',
  'Model output is advisory; articulation decisions stay with the institution.',
]

export default function ProfessorResourcesPage() {
  return (
    <PageContainer
      wide
      title="Faculty resources"
      subtitle="Workflows for syllabus alignment and catalog lookup. Not shared with the student transcript portal."
      breadcrumbs={[{ to: '/professor', label: 'Faculty' }, { label: 'Resources' }]}
    >
      <StakeholderNav items={navItems} />

      <div className="grid lg:grid-cols-3 gap-6 max-w-5xl">
        <div className="lg:col-span-2 space-y-6">
          <section className="cc-card p-8">
            <h2 className="cc-title-2 font-display mb-6">Quick links</h2>
            <ul className="space-y-4">
              <li>
                <Link to="/match" className="cc-link text-[15px] font-medium">
                  Custom syllabus match
                </Link>
                <p className="cc-footnote mt-1">Paste or enter syllabus text for a one-off comparison.</p>
              </li>
              <li>
                <Link to="/professor/quick-match" className="cc-link text-[15px] font-medium">
                  Quick match (faculty)
                </Link>
                <p className="cc-footnote mt-1">Pick an existing catalog course vs. a target school.</p>
              </li>
              <li>
                <Link to="/professor/catalog" className="cc-link text-[15px] font-medium">
                  Browse catalog (faculty)
                </Link>
                <p className="cc-footnote mt-1">Search and inspect loaded course rows.</p>
              </li>
            </ul>
          </section>

          <section className="cc-card p-8">
            <h2 className="cc-title-2 font-display mb-5">Tips</h2>
            <ul className="space-y-3">
              {tips.map((t) => (
                <li key={t} className="flex gap-3 cc-footnote leading-relaxed">
                  <span className="text-[var(--cc-accent)] font-semibold shrink-0">·</span>
                  {t}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="cc-card p-6 h-fit">
          <h2 className="cc-title-3 font-display mb-2">API</h2>
          <p className="cc-footnote leading-relaxed mb-4">Reference for integrators.</p>
          <a
            href="/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="cc-btn-primary w-full justify-center"
          >
            Open /api/docs
          </a>
        </aside>
      </div>
    </PageContainer>
  )
}
