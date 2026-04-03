import { useEffect, useState } from 'react'
import PageContainer from '../../components/layout/PageContainer'
import StakeholderNav from '../../components/stakeholders/StakeholderNav'
import { useAuth } from '../../auth/AuthContext'
import { isSupabaseConfigured } from '../../lib/supabaseClient'
import { listPendingFacultyReviews, setFacultyDecision } from '../../services/evaluationRecords'

const navItems = [
  { to: '/professor', label: 'Faculty', end: true },
  { to: '/professor/reviews', label: 'Evaluation reviews' },
  { to: '/professor/syllabus-tips', label: 'Syllabus tips' },
  { to: '/professor/contact-coordinator', label: 'Contact' },
]

export default function ProfessorFacultyReviewsPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState({})
  const [msg, setMsg] = useState(null)

  const reload = () => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    setLoading(true)
    listPendingFacultyReviews()
      .then(setRows)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    reload()
  }, [])

  const decide = async (evaluationId, decision) => {
    setMsg(null)
    try {
      await setFacultyDecision(evaluationId, user.id, decision, notes[evaluationId] || '')
      setMsg({ type: 'ok', text: `Marked ${decision}.` })
      reload()
    } catch (e) {
      setMsg({ type: 'err', text: e.message })
    }
  }

  return (
    <PageContainer
      wide
      title="Evaluation reviews"
      subtitle="MVP: one professor pool receives every submission after the student run completes. Approve or reject; details include stored JSON from the pipeline."
      breadcrumbs={[{ to: '/professor', label: 'Faculty' }, { label: 'Reviews' }]}
    >
      <StakeholderNav items={navItems} />

      {!isSupabaseConfigured && (
        <p className="cc-footnote mb-8">
          Enable cloud storage for this deployment and sign in with a faculty email account to use this page.
        </p>
      )}

      {msg && (
        <p className={`mb-6 ${msg.type === 'ok' ? 'text-[#34c759]' : 'text-[var(--cc-danger)]'}`}>{msg.text}</p>
      )}

      {loading ? (
        <p className="cc-footnote">Loading…</p>
      ) : (
        <div className="space-y-6">
          {rows.map((r) => (
            <div key={r.id} className="cc-card p-6 space-y-4">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase text-[var(--cc-label-secondary)]">Evaluation</p>
                  <p className="font-mono text-[13px] mt-1">{r.id}</p>
                  <p className="cc-footnote mt-2">
                    Student <span className="font-mono">{r.student_id}</span> · Target{' '}
                    <strong>{r.target_university}</strong> · {r.status}
                  </p>
                </div>
                <p className="cc-footnote">{r.created_at ? new Date(r.created_at).toLocaleString() : ''}</p>
              </div>
              <p className="text-[15px] text-[var(--cc-label)]">{r.summary}</p>
              <details className="cc-footnote">
                <summary className="cursor-pointer text-[var(--cc-accent)] font-medium">View stored result JSON</summary>
                <pre className="mt-3 p-4 rounded-[var(--cc-radius-md)] bg-[var(--cc-bg)] overflow-x-auto text-[11px] max-h-64">
                  {JSON.stringify(r.result_json, null, 2)}
                </pre>
              </details>
              <textarea
                className="cc-input min-h-[72px]"
                placeholder="Notes to student / registrar (optional)"
                value={notes[r.id] || ''}
                onChange={(e) => setNotes((prev) => ({ ...prev, [r.id]: e.target.value }))}
              />
              <div className="flex flex-wrap gap-3">
                <button type="button" className="cc-btn-primary" onClick={() => decide(r.id, 'approved')}>
                  Approve
                </button>
                <button
                  type="button"
                  className="cc-btn-secondary px-5 py-2.5 border-[var(--cc-danger)] text-[var(--cc-danger)]"
                  onClick={() => decide(r.id, 'rejected')}
                >
                  Do not approve
                </button>
              </div>
            </div>
          ))}
          {rows.length === 0 && isSupabaseConfigured && (
            <p className="cc-footnote">No evaluations waiting for review.</p>
          )}
        </div>
      )}
    </PageContainer>
  )
}
