import { Link } from 'react-router-dom'
import PageContainer from '../../components/layout/PageContainer'
import StakeholderNav from '../../components/stakeholders/StakeholderNav'

const navItems = [
  { to: '/professor', label: 'Overview', end: true },
  { to: '/professor/syllabus-tips', label: 'Syllabus tips' },
  { to: '/professor/contact-coordinator', label: 'Contact coordinator' },
]

const tips = [
  'List measurable outcomes — they align better with catalog learning objectives than titles alone.',
  'Use the knowledge points field for themes, methods, and tools (e.g. “regression”, “Python”, “ethics”).',
  'Include prerequisites and textbook info when possible; the engine can use them as weak signals.',
  'If no catalog row exists for your course, coordinators may still create a custom articulation outside this tool.',
]

export default function ProfessorSyllabusTipsPage() {
  return (
    <PageContainer
      title="Syllabus tips"
      subtitle="Static guidance to improve match quality. No data is saved from this page."
      breadcrumbs={[
        { to: '/professor', label: 'Faculty' },
        { label: 'Syllabus tips' },
      ]}
    >
      <StakeholderNav items={navItems} />

      <div className="cc-card p-8 max-w-2xl mb-10">
        <ul className="space-y-4">
          {tips.map((t) => (
            <li key={t} className="flex gap-3 cc-footnote leading-relaxed">
              <span className="text-[var(--cc-accent)] font-bold shrink-0">·</span>
              {t}
            </li>
          ))}
        </ul>
      </div>

      <Link to="/match" className="cc-btn-primary">
        Open syllabus matcher
      </Link>
    </PageContainer>
  )
}
