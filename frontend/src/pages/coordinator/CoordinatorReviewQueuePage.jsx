import { Link } from 'react-router-dom'
import PageContainer from '../../components/layout/PageContainer'
import StakeholderNav from '../../components/stakeholders/StakeholderNav'

const navItems = [
  { to: '/coordinator', label: 'Overview', end: true },
  { to: '/coordinator/review-queue', label: 'Review queue' },
  { to: '/coordinator/policies', label: 'Policies' },
]

const placeholderRows = [
  { id: '—', student: 'Pending integration', course: '—', status: 'Static placeholder' },
  { id: '—', student: 'Supabase will populate', course: '—', status: '—' },
]

export default function CoordinatorReviewQueuePage() {
  return (
    <PageContainer
      title="Review queue"
      subtitle="This table is static. Connect Supabase to show real pending evaluations and assignments."
      breadcrumbs={[
        { to: '/coordinator', label: 'Coordinator' },
        { label: 'Review queue' },
      ]}
    >
      <StakeholderNav items={navItems} />

      <div className="cc-card overflow-hidden mb-8">
        <table className="w-full text-[15px]">
          <thead>
            <tr className="bg-[var(--cc-bg)] border-b border-[var(--cc-separator)]">
              <th className="text-left py-3 px-4 font-medium text-[var(--cc-label-secondary)]">Case ID</th>
              <th className="text-left py-3 px-4 font-medium text-[var(--cc-label-secondary)]">Student</th>
              <th className="text-left py-3 px-4 font-medium text-[var(--cc-label-secondary)]">Course</th>
              <th className="text-left py-3 px-4 font-medium text-[var(--cc-label-secondary)]">Status</th>
            </tr>
          </thead>
          <tbody>
            {placeholderRows.map((row, i) => (
              <tr key={i} className="border-b border-[var(--cc-border)]">
                <td className="py-3 px-4 cc-footnote">{row.id}</td>
                <td className="py-3 px-4">{row.student}</td>
                <td className="py-3 px-4 cc-footnote">{row.course}</td>
                <td className="py-3 px-4 cc-footnote">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="cc-footnote mb-6">
        Until the database exists, use <Link className="cc-link" to="/batch">batch evaluation</Link> and{' '}
        <Link className="cc-link" to="/dashboard">dashboard</Link> for real workload on the current CSV-backed API.
      </p>
    </PageContainer>
  )
}
