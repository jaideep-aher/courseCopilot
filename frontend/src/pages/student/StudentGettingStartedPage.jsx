import PageContainer from '../../components/layout/PageContainer'
import StakeholderNav from '../../components/stakeholders/StakeholderNav'
import { Link } from 'react-router-dom'

const navItems = [
  { to: '/student', label: 'Dashboard', end: true },
  { to: '/student/getting-started', label: 'Getting started' },
  { to: '/student/faq', label: 'FAQ' },
]

const steps = [
  {
    title: 'Upload your transcript',
    body: 'On the Transcript tab, add your PDF and the school you are transferring into, then run the evaluation when your server has the pipeline configured.',
  },
  {
    title: 'Confirm the target school name',
    body: 'The name must match your dataset (e.g. how Duke appears in the CSV). Wrong spelling often means empty matches.',
  },
  {
    title: 'Try quick match for one course',
    body: 'If you only need a single course checked, Quick match ranks equivalents and shows rationales without a full PDF.',
  },
  {
    title: 'Talk to your coordinator',
    body: 'Scores are decision-support only. Final articulation stays with your institution; messaging can connect here when your school enables it.',
  },
]

export default function StudentGettingStartedPage() {
  return (
    <PageContainer
      title="Getting started"
      subtitle="A simple path through the student workspace. Static guide for now."
      breadcrumbs={[
        { to: '/student', label: 'Student' },
        { label: 'Getting started' },
      ]}
    >
      <StakeholderNav items={navItems} />

      <ol className="space-y-8 max-w-2xl">
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-5">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold text-white"
              style={{ background: 'var(--cc-accent)' }}
            >
              {i + 1}
            </span>
            <div>
              <h3 className="font-semibold text-[17px] text-[var(--cc-label)]">{s.title}</h3>
              <p className="mt-2 cc-footnote leading-relaxed">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link to="/student" className="cc-btn-primary">
          Upload transcript
        </Link>
        <Link to="/student/quick-match" className="cc-btn-secondary px-5 py-2.5">
          Quick match
        </Link>
      </div>
    </PageContainer>
  )
}
