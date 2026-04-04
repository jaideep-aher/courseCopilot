import { useEffect, useMemo, useState } from 'react'
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

export default function CoordinatorOperationsPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!isSupabaseConfigured) {
        setLoading(false)
        return
      }
      try {
        const data = await listEvaluationsForUniversity()
        if (!cancelled) setRows(data)
      } catch (e) {
        if (!cancelled) setErr(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const counts = useMemo(() => {
    const c = {}
    for (const r of rows) {
      c[r.status] = (c[r.status] || 0) + 1
    }
    return c
  }, [rows])

  const totalStudents = useMemo(() => new Set(rows.map((r) => r.student_id)).size, [rows])

  return (
    <PageContainer
      wide
      title="Operations dashboard"
      subtitle="Volume and pipeline state across stored student evaluation runs."
      breadcrumbs={[{ to: '/coordinator', label: 'University' }, { label: 'Operations' }]}
    >
      <StakeholderNav items={navItems} />

      {!isSupabaseConfigured && (
        <div className="cc-card p-8 mb-8 border border-[#ff9500]/30 bg-[rgba(255,149,0,0.06)]">
          <p className="font-medium text-[var(--cc-label)]">Evaluation data unavailable in this build</p>
          <p className="cc-footnote mt-2">
            The live site needs its online connection variables set when the app is built. If your team already did that,
            redeploy the frontend; otherwise ask whoever hosts the app to add them and ship a new build.
          </p>
        </div>
      )}

      {err && <p className="text-[var(--cc-danger)] mb-6">{err}</p>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Students with submissions', value: loading ? '…' : totalStudents },
          { label: 'Total evaluation runs', value: loading ? '…' : rows.length },
          { label: 'Faculty review', value: loading ? '…' : counts.faculty_review ?? 0 },
          { label: 'Final approved', value: loading ? '…' : counts.approved ?? 0 },
        ].map((x) => (
          <div key={x.label} className="cc-card p-6">
            <p className="text-[11px] font-semibold uppercase text-[var(--cc-label-secondary)]">{x.label}</p>
            <p className="mt-3 cc-title-2 font-display">{x.value}</p>
          </div>
        ))}
      </div>

      <div className="cc-card p-6">
        <h2 className="cc-title-3 font-display mb-4">By status</h2>
        <ul className="space-y-2 cc-footnote">
          {Object.keys(counts).length === 0 && !loading && <li>No rows yet.</li>}
          {Object.entries(counts).map(([k, v]) => (
            <li key={k} className="flex justify-between gap-4">
              <span>{k.replace(/_/g, ' ')}</span>
              <span className="font-semibold tabular-nums">{v}</span>
            </li>
          ))}
        </ul>
      </div>
    </PageContainer>
  )
}
