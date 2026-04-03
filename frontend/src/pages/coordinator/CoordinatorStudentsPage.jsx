import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageContainer from '../../components/layout/PageContainer'
import StakeholderNav from '../../components/stakeholders/StakeholderNav'
import { isSupabaseConfigured } from '../../lib/supabaseClient'
import { listEvaluationsForUniversity } from '../../services/evaluationRecords'

const navItems = [
  { to: '/coordinator', label: 'University', end: true },
  { to: '/coordinator/operations', label: 'Operations' },
  { to: '/coordinator/students', label: 'Evaluations' },
  { to: '/coordinator/deadlines', label: 'Deadlines' },
  { to: '/coordinator/review-queue', label: 'Review queue' },
  { to: '/coordinator/policies', label: 'Policies' },
]

export default function CoordinatorStudentsPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    listEvaluationsForUniversity()
      .then(setRows)
      .finally(() => setLoading(false))
  }, [])

  return (
    <PageContainer
      wide
      title="Evaluation records"
      subtitle="Every stored run by student account. Use this to see who is in progress and open faculty review."
      breadcrumbs={[{ to: '/coordinator', label: 'University' }, { label: 'Evaluations' }]}
    >
      <StakeholderNav items={navItems} />

      {!isSupabaseConfigured ? (
        <p className="cc-footnote">Connect cloud storage for this deployment to list evaluation rows.</p>
      ) : loading ? (
        <p className="cc-footnote">Loading…</p>
      ) : (
        <div className="cc-card overflow-hidden">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="bg-[var(--cc-bg)] border-b border-[var(--cc-separator)] text-left text-[11px] uppercase text-[var(--cc-label-secondary)]">
                <th className="py-3 px-4">Student id</th>
                <th className="py-3 px-4">Target</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Summary</th>
                <th className="py-3 px-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--cc-border)]">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="py-2.5 px-4 font-mono text-[12px]">{r.student_id}</td>
                  <td className="py-2.5 px-4">{r.target_university}</td>
                  <td className="py-2.5 px-4">{r.status}</td>
                  <td className="py-2.5 px-4 cc-footnote max-w-xs truncate">{r.summary}</td>
                  <td className="py-2.5 px-4 cc-footnote whitespace-nowrap">
                    {r.created_at ? new Date(r.created_at).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-8 cc-footnote">
        Set per-student deadlines on the{' '}
        <Link to="/coordinator/deadlines" className="cc-link">
          Deadlines
        </Link>{' '}
        page.
      </p>
    </PageContainer>
  )
}
