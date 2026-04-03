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

const bullets = [
  'Treat model output as advisory; maintain institutional articulation authority.',
  'Document exceptions in your SIS or articulation system — this UI does not yet persist decisions.',
  'Align target university strings with catalog data to avoid empty match results.',
  'When policy content is stored in your systems of record, text and approval chains can be versioned per institution.',
]

export default function CoordinatorPoliciesPage() {
  return (
    <PageContainer
      title="Policies & reference"
      subtitle="Static guidance for demo use. Replace with your official handbook or CMS-driven content later."
      breadcrumbs={[
        { to: '/coordinator', label: 'University' },
        { label: 'Policies' },
      ]}
    >
      <StakeholderNav items={navItems} />

      <div className="cc-card p-8 max-w-2xl">
        <ul className="space-y-4">
          {bullets.map((b) => (
            <li key={b} className="flex gap-3 cc-footnote leading-relaxed">
              <span className="text-[var(--cc-accent)] font-bold shrink-0">·</span>
              {b}
            </li>
          ))}
        </ul>
      </div>
    </PageContainer>
  )
}
