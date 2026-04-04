import { Link } from 'react-router-dom'
import PageContainer from '../../components/layout/PageContainer'
import StakeholderNav from '../../components/stakeholders/StakeholderNav'

const navItems = [
  { to: '/student', label: 'Dashboard', end: true },
  { to: '/student/getting-started', label: 'Getting started' },
  { to: '/student/faq', label: 'FAQ' },
]

const steps = [
  {
    title: 'Transcript + agent pipeline',
    body: 'Your main flow is on the Dashboard: PDF upload, live research stages, and match results.',
    to: '/student',
    cta: 'Open dashboard',
  },
  {
    title: 'One course at a time',
    body: 'Quick match compares a single catalog row to a target school without uploading a full PDF.',
    to: '/student/quick-match',
    cta: 'Open quick match',
  },
  {
    title: 'Browse the catalog',
    body: 'Search and inspect courses in the loaded dataset — same data staff see, student-only pages.',
    to: '/student/catalog',
    cta: 'Open catalog',
  },
]

export default function StudentResourcesPage() {
  return (
    <PageContainer
      wide
      title="Student help"
      subtitle="Guides and links for the transfer experience. These pages are separate from university evaluator tools."
      breadcrumbs={[{ to: '/student', label: 'Student' }, { label: 'Help' }]}
    >
      <StakeholderNav items={navItems} />

      <div className="max-w-2xl space-y-8 mb-12">
        <section className="cc-card p-8 sm:p-10">
          <h2 className="cc-title-2 font-display mb-8">Suggested path</h2>
          <ol className="space-y-10">
            {steps.map((w) => (
              <li key={w.title} className="flex gap-5">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold text-white"
                  style={{ background: 'var(--cc-accent)' }}
                >
                  ·
                </span>
                <div>
                  <h3 className="font-semibold text-[17px] text-[var(--cc-label)]">{w.title}</h3>
                  <p className="mt-2 cc-footnote leading-relaxed">{w.body}</p>
                  <Link to={w.to} className="inline-block mt-4 cc-link text-[15px]">
                    {w.cta}
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="cc-card p-6">
          <h2 className="cc-title-3 font-display mb-3">Developers</h2>
          <p className="cc-footnote leading-relaxed mb-4">
            OpenAPI for the same host: <code className="font-mono text-[13px]">/api/docs</code>
          </p>
          <a
            href="/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="cc-btn-secondary px-5 py-2.5 inline-flex"
          >
            API docs
          </a>
        </section>
      </div>
    </PageContainer>
  )
}
