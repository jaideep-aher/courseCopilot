import CourseMatchCard from './CourseMatchCard'
import Badge from '../common/Badge'

export default function ResultsDisplay({ result }) {
  if (!result) return null

  const {
    summary,
    recommendations,
    transcript_parse,
    source_university,
    target_university,
    processing_time_seconds,
    courses_parsed,
    source_courses_researched,
    target_courses_researched,
  } = result

  const parse = transcript_parse || {}

  return (
    <div className="space-y-6">
      <div className="cc-card p-6 sm:p-8">
        <h3 className="cc-title-2 font-display mb-6">Transcript overview</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-[15px] mb-5">
          <InfoRow label="Source university" value={source_university} />
          <InfoRow label="Target university" value={target_university} />
          {parse.student_name && <InfoRow label="Student name" value={parse.student_name} />}
          {parse.student_id && <InfoRow label="Student ID" value={parse.student_id} />}
          {parse.degree_program && <InfoRow label="Degree / major" value={parse.degree_program} />}
          {parse.gpa_info?.cumulative_gpa && (
            <InfoRow label="Cumulative GPA" value={parse.gpa_info.cumulative_gpa} />
          )}
          {parse.gpa_info?.total_credits_earned && (
            <InfoRow label="Credits earned" value={parse.gpa_info.total_credits_earned} />
          )}
          {parse.gpa_info?.total_credits_attempted && (
            <InfoRow label="Credits attempted" value={parse.gpa_info.total_credits_attempted} />
          )}
          <InfoRow
            label="Parse confidence"
            value={<Badge variant={parse.confidence || 'medium'}>{parse.confidence || 'unknown'}</Badge>}
          />
        </div>

        {parse.additional_info && (
          <div
            className="rounded-[var(--cc-radius-md)] p-4 text-[13px] mb-4 border"
            style={{
              background: 'rgba(0, 113, 227, 0.06)',
              borderColor: 'rgba(0, 113, 227, 0.15)',
              color: 'var(--cc-accent)',
            }}
          >
            <strong>Notes:</strong> {parse.additional_info}
          </div>
        )}

        {parse.warnings?.length > 0 && (
          <div
            className="rounded-[var(--cc-radius-md)] p-4 border"
            style={{
              background: 'rgba(255, 149, 0, 0.08)',
              borderColor: 'rgba(255, 149, 0, 0.2)',
            }}
          >
            <p className="text-[13px] font-semibold text-[#b45309] mb-2">Parsing warnings</p>
            {parse.warnings.map((w, i) => (
              <p key={i} className="text-[13px] text-[#b45309]">
                · {w}
              </p>
            ))}
          </div>
        )}
      </div>

      {parse.courses && parse.courses.length > 0 && (
        <div className="cc-card p-6 sm:p-8">
          <h3 className="cc-title-2 font-display mb-5">
            Courses on transcript ({parse.courses.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[15px]">
              <thead>
                <tr className="border-b border-[var(--cc-separator)] text-left text-[11px] font-semibold text-[var(--cc-label-secondary)] uppercase tracking-wide">
                  <th className="pb-3 pr-4">Code</th>
                  <th className="pb-3 pr-4">Course</th>
                  <th className="pb-3 pr-4">Credits</th>
                  <th className="pb-3">Semester</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--cc-border)]">
                {parse.courses.map((c, i) => (
                  <tr key={i} className="text-[var(--cc-label)]">
                    <td className="py-2.5 pr-4 font-mono text-[13px] font-medium">{c.course_code || '—'}</td>
                    <td className="py-2.5 pr-4">{c.course_name || '—'}</td>
                    <td className="py-2.5 pr-4 text-center">{c.credits ?? '—'}</td>
                    <td className="py-2.5 cc-footnote">{c.semester || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="cc-card p-6 sm:p-8">
        <h3 className="cc-title-2 font-display mb-6">Evaluation summary</h3>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          <StatBox label="Parsed" value={courses_parsed || 0} color="text-[var(--cc-label)]" />
          <StatBox label="Evaluated" value={summary?.total_evaluated || 0} color="text-[var(--cc-label)]" />
          <StatBox label="Approved" value={summary?.approve || 0} color="text-[#34c759]" />
          <StatBox label="Review" value={summary?.review || 0} color="text-[#ff9500]" />
          <StatBox label="Denied" value={summary?.deny || 0} color="text-[var(--cc-danger)]" />
        </div>

        <div className="flex flex-wrap gap-4 cc-footnote">
          <span>
            Source researched:{' '}
            <strong className="text-[var(--cc-label)] font-medium">{source_courses_researched || 0}</strong>
          </span>
          <span>
            Target found:{' '}
            <strong className="text-[var(--cc-label)] font-medium">{target_courses_researched || 0}</strong>
          </span>
          <span>
            Time:{' '}
            <strong className="text-[var(--cc-label)] font-medium">{processing_time_seconds}s</strong>
          </span>
        </div>

        {summary?.error && (
          <div className="mt-4 rounded-[var(--cc-radius-md)] p-4 text-[13px] border" style={{ ...dangerStyle }}>
            {summary.error}
          </div>
        )}
      </div>

      <div>
        <h3 className="cc-title-2 font-display mb-5">
          Results ({recommendations?.length || 0})
        </h3>
        {recommendations && recommendations.length > 0 ? (
          <div className="space-y-4">
            {recommendations.map((rec, idx) => (
              <CourseMatchCard key={idx} recommendation={rec} />
            ))}
          </div>
        ) : (
          <div className="cc-card p-10 text-center bg-[var(--cc-bg)] border-transparent">
            <p className="text-[17px] text-[var(--cc-label)]">No evaluation results</p>
            <p className="cc-footnote mt-2 max-w-md mx-auto">
              No courses could be researched or matched.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

const dangerStyle = {
  background: 'var(--cc-danger-bg)',
  borderColor: 'rgba(255, 59, 48, 0.2)',
  color: 'var(--cc-danger)',
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
      <span className="text-[var(--cc-label-secondary)] min-w-[8rem] shrink-0">{label}</span>
      <span className="font-medium text-[var(--cc-label)]">{typeof value === 'string' ? value : value}</span>
    </div>
  )
}

function StatBox({ label, value, color }) {
  return (
    <div className="text-center p-3 rounded-[var(--cc-radius-md)] bg-[var(--cc-bg)]">
      <p className={`text-[26px] font-semibold tabular-nums tracking-tight ${color}`}>{value}</p>
      <p className="cc-footnote mt-1">{label}</p>
    </div>
  )
}
