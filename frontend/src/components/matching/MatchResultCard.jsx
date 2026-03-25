import { useState } from 'react'
import Badge from '../common/Badge'
import ScoreBar from '../common/ScoreBar'

export default function MatchResultCard({ match, rank }) {
  const [expanded, setExpanded] = useState(false)
  const { target_course, similarity_percentage, confidence_level, topic_overlap, key_differences, recommendation_rationale } = match

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
            #{rank}
          </span>
          <div>
            <h4 className="font-semibold text-slate-900 text-sm">{target_course.course_title}</h4>
            <div className="flex gap-1.5 mt-1">
              <Badge>{target_course.university}</Badge>
              <Badge>{target_course.category?.replace(/_/g, ' ')}</Badge>
              {target_course.course_level && <Badge variant="default">{target_course.course_level}</Badge>}
            </div>
          </div>
        </div>
        <Badge variant={confidence_level}>{confidence_level}</Badge>
      </div>

      <div className="mb-3">
        <ScoreBar percentage={similarity_percentage} />
      </div>

      {topic_overlap && topic_overlap.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-slate-500 mb-1">Shared Topics</p>
          <div className="flex flex-wrap gap-1">
            {topic_overlap.map((t, i) => (
              <span key={i} className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {key_differences && key_differences.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-slate-500 mb-1">Key Differences</p>
          <div className="flex flex-wrap gap-1">
            {key_differences.map((d, i) => (
              <span key={i} className="bg-red-50 text-red-700 text-xs px-2 py-0.5 rounded">
                {d}
              </span>
            ))}
          </div>
        </div>
      )}

      {recommendation_rationale && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            {expanded ? 'Hide rationale' : 'Show rationale'}
          </button>
          {expanded && (
            <p className="mt-2 text-xs text-slate-600 bg-slate-50 rounded-lg p-3">
              {recommendation_rationale}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
