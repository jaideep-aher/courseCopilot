import { useState } from 'react'

const REC_CONFIG = {
  approve: { accent: 'border-l-green-500', badge: 'bg-green-100 text-green-800', label: 'Equivalent', dot: 'bg-green-500' },
  review:  { accent: 'border-l-yellow-500', badge: 'bg-yellow-100 text-yellow-800', label: 'Needs Review', dot: 'bg-yellow-500' },
  deny:    { accent: 'border-l-red-400', badge: 'bg-red-100 text-red-700', label: 'Unlikely Match', dot: 'bg-red-400' },
}

export default function CourseMatchCard({ recommendation }) {
  const { source_course, matches, recommendation: rec, confidence, rationale } = recommendation
  const config = REC_CONFIG[rec] || REC_CONFIG.deny
  const hasMatches = matches && matches.length > 0

  return (
    <div className={`bg-white rounded-xl border border-slate-200 border-l-4 ${config.accent} overflow-hidden`}>
      {/* Source course header */}
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-slate-900 text-[15px]">
                {source_course.course_title}
              </h4>
              {source_course.source_link && (
                <a href={source_course.source_link} target="_blank" rel="noopener noreferrer"
                  className="shrink-0 text-blue-500 hover:text-blue-700" title="View source course">
                  <LinkIcon />
                </a>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {source_course.university}
              {source_course.category ? ` · ${source_course.category.replace(/_/g, ' ')}` : ''}
              {source_course.course_level ? ` · ${source_course.course_level}` : ''}
            </p>
          </div>
          <span className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-bold ${config.badge}`}>
            {config.label}
          </span>
        </div>

        {rationale && (
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">{rationale}</p>
        )}
      </div>

      {/* Matches */}
      {hasMatches && (
        <div className="border-t border-slate-100">
          {matches.map((match, idx) => (
            <MatchRow key={idx} match={match} rank={idx + 1} isLast={idx === matches.length - 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function MatchRow({ match, rank, isLast }) {
  const [expanded, setExpanded] = useState(false)
  const { target_course, similarity_percentage, confidence_level,
    topic_overlap, key_differences, recommendation_rationale } = match

  const scoreColor = similarity_percentage >= 70 ? 'text-green-600'
    : similarity_percentage >= 40 ? 'text-yellow-600' : 'text-red-500'

  const barColor = similarity_percentage >= 70 ? 'bg-green-500'
    : similarity_percentage >= 40 ? 'bg-yellow-500' : 'bg-red-400'

  return (
    <div className={!isLast ? 'border-b border-slate-50' : ''}>
      {/* Row header */}
      <div
        className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-slate-50/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Score circle */}
        <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center shrink-0 ${
          similarity_percentage >= 70 ? 'border-green-400 bg-green-50' :
          similarity_percentage >= 40 ? 'border-yellow-400 bg-yellow-50' : 'border-red-300 bg-red-50'
        }`}>
          <span className={`text-sm font-bold ${scoreColor}`}>{similarity_percentage}</span>
        </div>

        {/* Course info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium text-slate-900 truncate">
              {target_course.course_title}
            </p>
            {target_course.source_link && (
              <a href={target_course.source_link} target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 text-blue-500 hover:text-blue-700" title="View course catalog page">
                <LinkIcon />
              </a>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {target_course.university}
            {target_course.category ? ` · ${target_course.category.replace(/_/g, ' ')}` : ''}
          </p>
        </div>

        {/* Expand arrow */}
        <svg className={`w-4 h-4 text-slate-300 transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-5 pb-4 ml-14 space-y-3">
          {/* Score bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${barColor}`}
                style={{ width: `${Math.min(similarity_percentage, 100)}%` }} />
            </div>
            <span className="text-xs text-slate-400">{confidence_level} confidence</span>
          </div>

          {/* Description */}
          {target_course.summary_text && (
            <p className="text-xs text-slate-600 leading-relaxed">{target_course.summary_text}</p>
          )}

          {/* Shared topics */}
          {topic_overlap && topic_overlap.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <span className="text-xs text-slate-400 mr-1">Shared:</span>
              {topic_overlap.map((t, i) => (
                <span key={i} className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded">{t}</span>
              ))}
            </div>
          )}

          {/* Differences */}
          {key_differences && key_differences.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <span className="text-xs text-slate-400 mr-1">Differs:</span>
              {key_differences.map((d, i) => (
                <span key={i} className="bg-red-50 text-red-600 text-xs px-2 py-0.5 rounded">{d}</span>
              ))}
            </div>
          )}

          {/* Rationale */}
          {recommendation_rationale && (
            <p className="text-xs text-slate-500 italic">{recommendation_rationale}</p>
          )}

          {/* Prominent catalog link */}
          {target_course.source_link && (
            <a href={target_course.source_link} target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-md">
              <LinkIcon />
              Open Course Catalog Page
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function LinkIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  )
}
