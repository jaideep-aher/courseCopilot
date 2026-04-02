import { useState } from 'react'
import CourseMatchCard from './CourseMatchCard'

export default function ResultsDisplay({ result }) {
  if (!result) return null
  const [showTranscript, setShowTranscript] = useState(false)

  const {
    summary, recommendations, transcript_parse, source_university,
    target_university, processing_time_seconds, courses_parsed,
    source_courses_researched, target_courses_researched,
  } = result

  const parse = transcript_parse || {}
  const approveCount = summary?.approve || 0
  const reviewCount = summary?.review || 0
  const denyCount = summary?.deny || 0

  return (
    <div className="space-y-6">

      {/* ---- Compact Summary Header ---- */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Transfer Credit Evaluation</h2>
              <p className="text-blue-100 text-sm mt-0.5">
                {source_university} &rarr; {target_university}
              </p>
            </div>
            <div className="text-right text-sm text-blue-100">
              {parse.student_name && <p className="font-medium text-white">{parse.student_name}</p>}
              {parse.degree_program && <p>{parse.degree_program}</p>}
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Stat pills */}
            <div className="flex gap-3">
              <StatPill label="Evaluated" value={summary?.total_evaluated || 0} />
              <StatPill label="Equivalent" value={approveCount} color="text-green-700 bg-green-50 border-green-200" />
              <StatPill label="Needs Review" value={reviewCount} color="text-yellow-700 bg-yellow-50 border-yellow-200" />
              <StatPill label="Unlikely" value={denyCount} color="text-red-700 bg-red-50 border-red-200" />
            </div>
            <span className="text-xs text-slate-400">{processing_time_seconds}s</span>
          </div>

          {/* Collapsible transcript details */}
          {parse.courses && parse.courses.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
              >
                <svg className={`w-3.5 h-3.5 transition-transform ${showTranscript ? 'rotate-90' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                View {parse.courses.length} parsed courses from transcript
              </button>

              {showTranscript && (
                <div className="mt-3 max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <th className="pb-1.5 pr-3 font-medium">Code</th>
                        <th className="pb-1.5 pr-3 font-medium">Course</th>
                        <th className="pb-1.5 pr-3 font-medium">Cr</th>
                        <th className="pb-1.5 font-medium">Term</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {parse.courses.map((c, i) => (
                        <tr key={i} className="text-slate-600">
                          <td className="py-1.5 pr-3 font-mono font-medium">{c.course_code || '—'}</td>
                          <td className="py-1.5 pr-3">{c.course_name || '—'}</td>
                          <td className="py-1.5 pr-3 text-center">{c.credits ?? '—'}</td>
                          <td className="py-1.5 text-slate-400">{c.semester || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Warnings */}
          {parse.warnings?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              {parse.warnings.map((w, i) => (
                <p key={i} className="text-xs text-amber-600">⚠ {w}</p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---- Per-Course Results ---- */}
      {recommendations && recommendations.length > 0 ? (
        <div className="space-y-3">
          {recommendations.map((rec, idx) => (
            <CourseMatchCard key={idx} recommendation={rec} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <p className="text-slate-500">No evaluation results available.</p>
          <p className="text-xs text-slate-400 mt-1">
            This may happen if no courses could be researched or matched.
          </p>
        </div>
      )}
    </div>
  )
}

function StatPill({ label, value, color = 'text-slate-700 bg-slate-50 border-slate-200' }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${color}`}>
      <span className="text-base font-bold">{value}</span>
      <span className="opacity-70">{label}</span>
    </div>
  )
}
