import CourseMatchCard from './CourseMatchCard'
import Badge from '../common/Badge'

export default function ResultsDisplay({ result }) {
  if (!result) return null

  const {
    summary, recommendations, transcript_parse, source_university,
    target_university, processing_time_seconds, courses_parsed,
    source_courses_researched, target_courses_researched,
  } = result

  const parse = transcript_parse || {}

  return (
    <div className="space-y-6">

      {/* ---- Transcript Overview ---- */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Transcript Overview</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm mb-4">
          <InfoRow label="Source University" value={source_university} />
          <InfoRow label="Target University" value={target_university} />
          {parse.student_name && <InfoRow label="Student Name" value={parse.student_name} />}
          {parse.student_id && <InfoRow label="Student ID" value={parse.student_id} />}
          {parse.degree_program && <InfoRow label="Degree / Major" value={parse.degree_program} />}
          {parse.gpa_info?.cumulative_gpa && (
            <InfoRow label="Cumulative GPA" value={parse.gpa_info.cumulative_gpa} />
          )}
          {parse.gpa_info?.total_credits_earned && (
            <InfoRow label="Credits Earned" value={parse.gpa_info.total_credits_earned} />
          )}
          {parse.gpa_info?.total_credits_attempted && (
            <InfoRow label="Credits Attempted" value={parse.gpa_info.total_credits_attempted} />
          )}
          <InfoRow label="Parse Confidence" value={
            <Badge variant={parse.confidence || 'medium'}>{parse.confidence || 'unknown'}</Badge>
          } />
        </div>

        {parse.additional_info && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 mb-4">
            <strong>Notes:</strong> {parse.additional_info}
          </div>
        )}

        {parse.warnings?.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs font-medium text-yellow-800 mb-1">Parsing Warnings:</p>
            {parse.warnings.map((w, i) => (
              <p key={i} className="text-xs text-yellow-700">- {w}</p>
            ))}
          </div>
        )}
      </div>

      {/* ---- Parsed Courses Table ---- */}
      {parse.courses && parse.courses.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">
            Courses Found on Transcript ({parse.courses.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <th className="pb-2 pr-4">Code</th>
                  <th className="pb-2 pr-4">Course Name</th>
                  <th className="pb-2 pr-4">Credits</th>
                  <th className="pb-2">Semester</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parse.courses.map((c, i) => (
                  <tr key={i} className="text-slate-700">
                    <td className="py-2 pr-4 font-mono text-xs font-medium">{c.course_code || '—'}</td>
                    <td className="py-2 pr-4">{c.course_name || '—'}</td>
                    <td className="py-2 pr-4 text-center">{c.credits ?? '—'}</td>
                    <td className="py-2 text-xs text-slate-500">{c.semester || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---- Evaluation Summary ---- */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Evaluation Summary</h3>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <StatBox label="Courses Parsed" value={courses_parsed || 0} color="text-slate-700" />
          <StatBox label="Total Evaluated" value={summary?.total_evaluated || 0} color="text-slate-700" />
          <StatBox label="Approved" value={summary?.approve || 0} color="text-green-600" />
          <StatBox label="Needs Review" value={summary?.review || 0} color="text-yellow-600" />
          <StatBox label="Denied" value={summary?.deny || 0} color="text-red-600" />
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
          <span>Source courses researched: <strong className="text-slate-700">{source_courses_researched || 0}</strong></span>
          <span>Target courses found: <strong className="text-slate-700">{target_courses_researched || 0}</strong></span>
          <span>Processing time: <strong className="text-slate-700">{processing_time_seconds}s</strong></span>
        </div>

        {summary?.error && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
            {summary.error}
          </div>
        )}
      </div>

      {/* ---- Per-Course Recommendations ---- */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Course-by-Course Results ({recommendations?.length || 0})
        </h3>
        {recommendations && recommendations.length > 0 ? (
          <div className="space-y-4">
            {recommendations.map((rec, idx) => (
              <CourseMatchCard key={idx} recommendation={rec} />
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
            <p className="text-sm text-slate-500">No evaluation results available.</p>
            <p className="text-xs text-slate-400 mt-1">
              This may happen if no courses could be researched or matched.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-500 min-w-[140px]">{label}:</span>
      <span className="font-medium text-slate-900">{typeof value === 'string' ? value : value}</span>
    </div>
  )
}

function StatBox({ label, value, color }) {
  return (
    <div className="text-center p-3 bg-slate-50 rounded-lg">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  )
}
