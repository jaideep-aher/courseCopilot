import { Link } from 'react-router-dom'
import PageContainer from '../../components/layout/PageContainer'
import StakeholderNav from '../../components/stakeholders/StakeholderNav'

const navItems = [
  { to: '/professor', label: 'Faculty', end: true },
  { to: '/professor/reviews', label: 'Evaluation reviews' },
  { to: '/professor/syllabus-tips', label: 'Syllabus tips' },
  { to: '/professor/contact-coordinator', label: 'Contact coordinator' },
]

const tools = [
  {
    to: '/professor/reviews',
    title: 'Evaluation reviews',
    desc: 'Approve or reject student evaluation runs when cloud storage is enabled.',
    live: true,
  },
  {
    to: '/match',
    title: 'Custom syllabus match',
    desc: 'Enter course details and knowledge points to find catalog equivalents.',
    live: true,
  },
  {
    to: '/professor/catalog',
    title: 'Catalog',
    desc: 'Faculty-only catalog browser — same API, different pages than students or evaluators.',
    live: true,
  },
  {
    to: '/professor/quick-match',
    title: 'Quick match',
    desc: 'Faculty quick match; not the student or university URLs.',
    live: true,
  },
]

export default function ProfessorHomePage() {
  return (
    <PageContainer
      title="Faculty workspace"
      subtitle="Help students and coordinators with clear syllabus data. Live tools use your API; tips and contact flows stay static until messaging is wired in."
      breadcrumbs={[{ label: 'Faculty' }]}
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

      <div className="grid md:grid-cols-2 gap-4">
        <Link to="/professor/syllabus-tips" className="cc-card p-6 hover:shadow-[var(--cc-shadow-card-hover)] transition-shadow">
          <h3 className="cc-title-3 font-display mb-2">Syllabus tips</h3>
          <p className="cc-footnote">What to include so the matcher can score your course fairly.</p>
          <span className="mt-4 inline-block text-[15px] font-medium text-[var(--cc-accent)]">Read tips →</span>
        </Link>
        <Link
          to="/professor/contact-coordinator"
          className="cc-card p-6 hover:shadow-[var(--cc-shadow-card-hover)] transition-shadow"
        >
          <h3 className="cc-title-3 font-display mb-2">Contact coordinator</h3>
          <p className="cc-footnote">Static placeholder for routing questions to articulation staff.</p>
          <span className="mt-4 inline-block text-[15px] font-medium text-[var(--cc-accent)]">Open form →</span>
        </Link>
      </div>
    </PageContainer>
  )
}
