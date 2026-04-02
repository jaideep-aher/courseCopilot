import PageContainer from '../../components/layout/PageContainer'
import StakeholderNav from '../../components/stakeholders/StakeholderNav'

const navItems = [
  { to: '/student', label: 'Overview', end: true },
  { to: '/student/getting-started', label: 'Getting started' },
  { to: '/student/faq', label: 'FAQ' },
]

const faqs = [
  {
    q: 'Are match scores official decisions?',
    a: 'No. They are decision-support from the local model. Your registrar or articulation office makes the final call.',
  },
  {
    q: 'Why does my course show no matches?',
    a: 'The target university name must match the dataset, and the source course must exist in the CSV. Try custom syllabus if your class is not in the file.',
  },
  {
    q: 'Where will my saved data go?',
    a: 'Right now nothing is stored in a cloud database. A future Supabase integration will hold profiles, applications, and history securely.',
  },
]

export default function StudentFaqPage() {
  return (
    <PageContainer
      title="FAQ"
      subtitle="Common questions for the student portal (static content)."
      breadcrumbs={[
        { to: '/student', label: 'Student' },
        { label: 'FAQ' },
      ]}
    >
      <StakeholderNav items={navItems} />

      <div className="max-w-2xl space-y-8">
        {faqs.map(({ q, a }) => (
          <div key={q}>
            <h3 className="font-semibold text-[17px] text-[var(--cc-label)]">{q}</h3>
            <p className="mt-2 cc-footnote leading-relaxed">{a}</p>
          </div>
        ))}
      </div>
    </PageContainer>
  )
}
