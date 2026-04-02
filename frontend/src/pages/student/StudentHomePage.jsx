import { Link } from 'react-router-dom'
import PageContainer from '../../components/layout/PageContainer'
import StakeholderNav from '../../components/stakeholders/StakeholderNav'

const navItems = [
  { to: '/student', label: 'Overview', end: true },
  { to: '/student/getting-started', label: 'Getting started' },
  { to: '/student/faq', label: 'FAQ' },
]

const tools = [
  {
    to: '/transcript',
    title: 'Transcript upload',
    desc: 'Upload a PDF and run the evaluation pipeline when your server is configured.',
    live: true,
  },
  {
    to: '/catalog-match',
    title: 'Quick match',
    desc: 'Pick a course from the catalog and compare it to a target university.',
    live: true,
  },
  {
    to: '/courses',
    title: 'Browse catalog',
    desc: 'Search and inspect courses in the loaded dataset.',
    live: true,
  },
]

export default function StudentHomePage() {
  return (
    <PageContainer
      title="Student workspace"
      subtitle="Plan your transfer path, preview equivalencies, and keep everything in one place. Live tools below talk to your local API; other sections are static placeholders until data is connected."
      breadcrumbs={[{ label: 'Student' }]}
    >
      <StakeholderNav items={navItems} />

      <div className="grid md:grid-cols-3 gap-4 mb-12">
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

      <div className="cc-card p-8 bg-[var(--cc-bg)] border-transparent">
        <h3 className="cc-title-3 font-display mb-3">Coming next</h3>
        <p className="cc-footnote leading-relaxed max-w-2xl">
          Saved applications, messaging with coordinators, and status tracking will live here once Supabase (or your
          chosen backend) is wired up. For now, use the live tools above for real matching against your CSV-backed API.
        </p>
      </div>
    </PageContainer>
  )
}
