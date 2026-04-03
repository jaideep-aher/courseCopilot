import { useState } from 'react'
import PageContainer from '../../components/layout/PageContainer'
import StakeholderNav from '../../components/stakeholders/StakeholderNav'
import { useAuth } from '../../auth/AuthContext'
import { isSupabaseConfigured } from '../../lib/supabaseClient'
import { upsertStudentDeadline } from '../../services/evaluationRecords'

const navItems = [
  { to: '/coordinator', label: 'University', end: true },
  { to: '/coordinator/operations', label: 'Operations' },
  { to: '/coordinator/students', label: 'Evaluations' },
  { to: '/coordinator/deadlines', label: 'Deadlines' },
  { to: '/coordinator/review-queue', label: 'Review queue' },
  { to: '/coordinator/policies', label: 'Policies' },
]

export default function CoordinatorDeadlinesPage() {
  const { user } = useAuth()
  const [studentId, setStudentId] = useState('')
  const [dueLocal, setDueLocal] = useState('')
  const [notes, setNotes] = useState('')
  const [msg, setMsg] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setMsg(null)
    if (!isSupabaseConfigured) {
      setMsg({ type: 'err', text: 'Cloud storage is not enabled on this deployment.' })
      return
    }
    try {
      const dueAtIso = new Date(dueLocal).toISOString()
      await upsertStudentDeadline(studentId.trim(), dueAtIso, user.id, notes)
      setMsg({ type: 'ok', text: 'Deadline saved.' })
    } catch (err) {
      setMsg({ type: 'err', text: err.message })
    }
  }

  return (
    <PageContainer
      wide
      title="Student deadlines"
      subtitle="Set due dates for evaluation submission (students signed in with a full account)."
      breadcrumbs={[{ to: '/coordinator', label: 'University' }, { label: 'Deadlines' }]}
    >
      <StakeholderNav items={navItems} />

      <div className="max-w-xl cc-card p-8">
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-[13px] font-medium text-[var(--cc-label-secondary)] mb-2">
              Student profile UUID
            </label>
            <input
              className="cc-input font-mono text-[13px]"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="auth.users id"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[var(--cc-label-secondary)] mb-2">Due (local time)</label>
            <input
              type="datetime-local"
              className="cc-input"
              value={dueLocal}
              onChange={(e) => setDueLocal(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[var(--cc-label-secondary)] mb-2">Notes</label>
            <textarea className="cc-input min-h-[88px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <button type="submit" className="cc-btn-primary">
            Save deadline
          </button>
        </form>
        {msg && (
          <p className={`mt-4 text-[15px] ${msg.type === 'ok' ? 'text-[#34c759]' : 'text-[var(--cc-danger)]'}`}>
            {msg.text}
          </p>
        )}
      </div>
    </PageContainer>
  )
}
