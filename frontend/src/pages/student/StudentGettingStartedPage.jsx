import PageContainer from '../../components/layout/PageContainer'
import StakeholderNav from '../../components/stakeholders/StakeholderNav'
import { Link } from 'react-router-dom'

const navItems = [
  { to: '/student', label: 'Overview', end: true },
  { to: '/student/getting-started', label: 'Getting started' },
  { to: '/student/faq', label: 'FAQ' },
]

const steps = [
  {
    title: 'Confirm your target school',
    body: 'Know where you are transferring. Quick match and the catalog need the correct target university name to match rows in your dataset.',
  },
  {
    title: 'Try a quick match',
    body: 'If your course exists in the CSV, use Quick match to see ranked equivalents and rationales immediately.',
  },
  {
    title: 'Upload a transcript (optional)',
    body: 'When the transcript pipeline is enabled on the server, you can upload a PDF for a guided multi-course review.',
  },
  {
    title: 'Talk to your coordinator',
    body: 'Automated scores support humans — final decisions stay with your institution. This step will link to real messaging after Supabase is added.',
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

      <div className="mt-12">
        <Link to="/catalog-match" className="cc-btn-primary">
          Try quick match
        </Link>
      </div>
    </PageContainer>
  )
}
