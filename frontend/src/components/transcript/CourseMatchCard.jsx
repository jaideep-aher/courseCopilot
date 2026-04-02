import { useState } from 'react'
import Badge from '../common/Badge'
import ScoreBar from '../common/ScoreBar'

const REC_STYLES = {
  approve: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-300', label: 'Approved' },
  review: { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-300', label: 'Needs Review' },
  deny: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-300', label: 'No Match' },
}

export default function CourseMatchCard({ recommendation }) {
  const [expanded, setExpanded] = useState(false)
  const { source_course, matches, recommendation: rec, confidence, rationale } = recommendation
  const style = REC_STYLES[rec] || REC_STYLES.deny
  const hasMatches = matches && matches.length > 0

  return (
    <div className={`bg-white rounded-xl shadow-sm border ${style.border} overflow-hidden`}>
      {/* ---- Source Course Header ---- */}
      <div className={`${style.bg} px-5 py-4`}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-900">
              {source_course.course_title}
            </h4>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <Badge>{source_course.university}</Badge>
              {source_course.category && (
                <Badge>{source_course.category.replace(/_/g, ' ')}</Badge>
              )}
              {source_course.course_level && (
                <Badge variant="default">{source_course.course_level}</Badge>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${style.text} border ${style.border}`}>
              {style.label}
            </span>
            <span className="text-xs text-slate-500">Confidence: {confidence}</span>
          </div>
        </div>

        {/* Source course detail fields */}
        {source_course.summary_text && (
          <p className="mt-2 text-xs text-slate-600 line-clamp-2">{source_course.summary_text}</p>
        )}

        {/* Source syllabus link for professor review */}
        {source_course.source_link && (
          <a
            href={source_course.source_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-blue-700 hover:text-blue-900 hover:underline"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-4.5-6h6m0 0v6m0-6L9.75 14.25" />
            </svg>
            View Syllabus / Source
          </a>
        )}

        {/* Missing fields warning */}
        {source_course.missing_fields && source_course.missing_fields.length > 0 && (
          <div className="mt-2 text-xs text-amber-700">
            Missing data: {source_course.missing_fields.map(f => f.replace(/_/g, ' ')).join(', ')}
          </div>
        )}

        {/* Main topics from source */}
        {source_course.main_topics && source_course.main_topics.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {source_course.main_topics.slice(0, 8).map((t, i) => (
              <span key={i} className="bg-white/60 text-slate-600 text-xs px-2 py-0.5 rounded">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ---- Matches / No-Match Detail ---- */}
      <div className="p-5">
        {/* Rationale — always visible */}
        {rationale && (
          <div className="mb-4 bg-slate-50 border border-slate-200 rounded-lg p-3">
            <p className="text-xs font-medium text-slate-500 mb-1">Evaluation Rationale</p>
            <p className="text-sm text-slate-700">{rationale}</p>
          </div>
        )}

        {hasMatches ? (
          <div className="space-y-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Top {matches.length} Match{matches.length > 1 ? 'es' : ''}
            </p>
            {matches.map((match, idx) => (
              <MatchDetail key={idx} match={match} rank={idx + 1} />
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
            <p className="text-sm text-slate-600 font-medium">No equivalent courses found</p>
            <p className="text-xs text-slate-400 mt-1">
              The AI agent could not find courses at the target university that sufficiently
              overlap with this course's content, topics, or learning outcomes.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function MatchDetail({ match, rank }) {
  const [showDetails, setShowDetails] = useState(rank === 1) // auto-expand #1
  const { target_course, similarity_percentage, confidence_level, topic_overlap, key_differences, recommendation_rationale } = match

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      {/* Match header — always visible */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
            #{rank}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {target_course.course_title}
            </p>
            <div className="flex gap-1.5 mt-0.5">
              <span className="text-xs text-slate-500">{target_course.university}</span>
              {target_course.category && (
                <span className="text-xs text-slate-400">| {target_course.category.replace(/_/g, ' ')}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-3">
          <span className={`text-lg font-bold ${
            similarity_percentage >= 70 ? 'text-green-600' :
            similarity_percentage >= 40 ? 'text-yellow-600' : 'text-red-500'
          }`}>
            {similarity_percentage}%
          </span>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${showDetails ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expandable detail section */}
      {showDetails && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
          <ScoreBar percentage={similarity_percentage} />

          <div className="flex gap-2">
            <Badge variant={confidence_level}>{confidence_level} confidence</Badge>
            {target_course.course_level && <Badge variant="default">{target_course.course_level}</Badge>}
          </div>

          {/* Target course description */}
          {target_course.summary_text && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Course Description</p>
              <p className="text-xs text-slate-600">{target_course.summary_text}</p>
            </div>
          )}

          {/* Target course topics */}
          {target_course.main_topics && target_course.main_topics.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Target Course Topics</p>
              <div className="flex flex-wrap gap-1">
                {target_course.main_topics.map((t, i) => (
                  <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">{t}</span>
                ))}
              </div>
            </div>
          )}

          {topic_overlap && topic_overlap.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Shared Topics</p>
              <div className="flex flex-wrap gap-1">
                {topic_overlap.map((t, i) => (
                  <span key={i} className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded">{t}</span>
                ))}
              </div>
            </div>
          )}

          {key_differences && key_differences.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Key Differences</p>
              <div className="flex flex-wrap gap-1">
                {key_differences.map((d, i) => (
                  <span key={i} className="bg-red-50 text-red-700 text-xs px-2 py-0.5 rounded">{d}</span>
                ))}
              </div>
            </div>
          )}

          {recommendation_rationale && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Match Rationale</p>
              <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2">{recommendation_rationale}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
