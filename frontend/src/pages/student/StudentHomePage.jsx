import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageContainer from '../../components/layout/PageContainer'
import StakeholderNav from '../../components/stakeholders/StakeholderNav'
import TranscriptUploadPanel from '../../components/transcript/TranscriptUploadPanel'
import StudentDashboardStats from '../../components/student/StudentDashboardStats'
import StudentEvaluationsList from '../../components/student/StudentEvaluationsList'
import { useAuth } from '../../auth/AuthContext'
import { isSupabaseConfigured } from '../../lib/supabaseClient'
import {
  getStudentDeadline,
  listEvaluationsForStudent,
  saveStudentEvaluation,
} from '../../services/evaluationRecords'

const navItems = [
  { to: '/student', label: 'Dashboard', end: true },
  { to: '/student/getting-started', label: 'Getting started' },
  { to: '/student/faq', label: 'FAQ' },
]

const secondaryTools = [
  {
    to: '/student/quick-match',
    title: 'Quick match',
    desc: 'One course from the catalog vs. a target school (student tool).',
  },
  {
    to: '/student/catalog',
    title: 'Browse catalog',
    desc: 'Student-only catalog view — same data, different pages than staff.',
  },
]

export default function StudentHomePage() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState(null)
  const [saveBanner, setSaveBanner] = useState(null)
  const [deadline, setDeadline] = useState(null)

  const reload = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    setListError(null)
    try {
      const data = await listEvaluationsForStudent(user.id)
      setRows(data)
      const d = await getStudentDeadline(user.id)
      setDeadline(d)
    } catch (e) {
      setListError(e.message || 'Could not load evaluations')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    reload()
  }, [reload])

  const inReview = useMemo(
    () => rows.filter((r) => r.status === 'faculty_review' || r.status === 'coordinator_review').length,
    [rows]
  )

  const deadlineLabel = deadline?.due_at
    ? `${new Date(deadline.due_at).toLocaleString()}${deadline.notes ? ` · ${deadline.notes}` : ''}`
    : null

  const handleEvaluationComplete = useCallback(
    async (result, { targetUniversity }) => {
      if (!user?.id) return
      try {
        await saveStudentEvaluation(user.id, { targetUniversity, result })
        setSaveBanner({
          type: 'ok',
          text: isSupabaseConfigured
            ? 'Evaluation saved.'
            : 'Evaluation saved in this browser only. Use email sign-in on a deployment with cloud storage so staff can see your runs.',
        })
        await reload()
      } catch (e) {
        setSaveBanner({ type: 'err', text: e.message || 'Could not save evaluation' })
      }
    },
    [user?.id, reload]
  )

  return (
    <PageContainer wide breadcrumbs={[{ label: 'Student' }]} title={null} subtitle={null}>
      <div className="mb-10">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--cc-accent)] mb-2">
          Student dashboard
        </p>
        <h1 className="cc-large-title font-display max-w-3xl">Transfer credit workspace</h1>
        {isSupabaseConfigured ? (
          <p className="mt-4 text-[19px] leading-relaxed text-[var(--cc-label-secondary)] max-w-3xl">
            Run the transcript pipeline, track saved evaluations, and see deadlines. Data is tied to your signed-in
            account so your school can review progress when you use email login (not the local-only demo usernames).
          </p>
        ) : (
          <>
            <p className="mt-4 text-[19px] leading-relaxed text-[var(--cc-label-secondary)] max-w-3xl">
              Run the transcript pipeline and track runs here. Until cloud storage is enabled for this deployment, saves
              stay in <strong className="text-[var(--cc-label)]">this browser only</strong>.
            </p>
            <p className="mt-3 cc-footnote max-w-3xl">
              To sync across devices and show runs to university staff, your deployment needs the project&apos;s cloud
              URL and anonymous key in the <strong>frontend</strong> build environment, then a fresh deploy.
            </p>
          </>
        )}
      </div>

      <StudentDashboardStats totalRuns={rows.length} inReview={inReview} deadlineLabel={deadlineLabel} />

      {saveBanner && (
        <div
          className={`mb-8 rounded-[var(--cc-radius-md)] px-5 py-4 text-[15px] ${
            saveBanner.type === 'ok'
              ? 'bg-[rgba(52,199,89,0.12)] text-[#1d7c3a] border border-[rgba(52,199,89,0.35)]'
              : 'bg-[var(--cc-danger-bg)] text-[var(--cc-danger)] border border-[var(--cc-danger)]/20'
          }`}
        >
          {saveBanner.text}
        </div>
      )}

      <div className="mb-12">
        <StudentEvaluationsList rows={rows} loading={loading} error={listError} />
      </div>

      <div className="cc-hero px-8 py-12 sm:px-12 sm:py-14 mb-10 rounded-[var(--cc-radius-lg)] border border-[var(--cc-border)]">
        <h2 className="cc-title-2 font-display max-w-3xl">Transcript · research agent pipeline</h2>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--cc-label-secondary)] max-w-3xl">
          Upload a PDF and run the full evaluation. When results appear, they are stored automatically for this account.
        </p>
        <div className="mt-10">
          <TranscriptUploadPanel
            variant="workspace"
            embeddedInHero
            showHowItWorksWhenIdle
            onEvaluationComplete={handleEvaluationComplete}
          />
        </div>
      </div>

      <StakeholderNav items={navItems} />

      <section aria-labelledby="student-more-heading" className="mt-14">
        <h2 id="student-more-heading" className="cc-title-2 font-display mb-4">
          Other tools
        </h2>
        <p className="cc-footnote mb-5 max-w-xl">Quick paths that skip the full transcript flow.</p>
        <div className="grid sm:grid-cols-2 gap-4 max-w-3xl">
          {secondaryTools.map(({ to, title, desc }) => (
            <Link
              key={to}
              to={to}
              className="cc-card p-5 flex flex-col hover:shadow-[var(--cc-shadow-card-hover)] transition-shadow"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="cc-title-3 font-display">{title}</h3>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#34c759]">Live</span>
              </div>
              <p className="cc-footnote leading-relaxed flex-1">{desc}</p>
              <span className="mt-4 text-[15px] font-medium text-[var(--cc-accent)]">Open →</span>
            </Link>
          ))}
        </div>
      </section>

    </PageContainer>
  )
}
