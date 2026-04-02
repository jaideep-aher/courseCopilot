import { useState } from 'react'
import Badge from '../common/Badge'
import ScoreBar from '../common/ScoreBar'

export default function MatchResultCard({ match, rank }) {
  const [expanded, setExpanded] = useState(false)
  const {
    target_course,
    similarity_percentage,
    confidence_level,
    topic_overlap,
    key_differences,
    recommendation_rationale,
  } = match

  return (
    <div className="cc-card p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold text-white shrink-0"
            style={{ background: 'var(--cc-accent)' }}
          >
            {rank}
          </span>
          <div className="min-w-0">
            <h4 className="font-semibold text-[17px] text-[var(--cc-label)] leading-snug">
              {target_course.course_title}
            </h4>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Badge>{target_course.university}</Badge>
              <Badge>{target_course.category?.replace(/_/g, ' ')}</Badge>
              {target_course.course_level && <Badge variant="default">{target_course.course_level}</Badge>}
            </div>
          </div>
        </div>
        <Badge variant={confidence_level}>{confidence_level}</Badge>
      </div>

      <div className="mb-4">
        <ScoreBar percentage={similarity_percentage} />
      </div>

      {topic_overlap && topic_overlap.length > 0 && (
        <div className="mb-4">
          <p className="text-[11px] font-semibold text-[var(--cc-label-secondary)] uppercase tracking-wide mb-2">
            Shared topics
          </p>
          <div className="flex flex-wrap gap-1.5">
            {topic_overlap.map((t, i) => (
              <span
                key={i}
                className="text-[13px] px-2 py-1 rounded-full bg-[rgba(52,199,89,0.12)] text-[#1d7c35]"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {key_differences && key_differences.length > 0 && (
        <div className="mb-4">
          <p className="text-[11px] font-semibold text-[var(--cc-label-secondary)] uppercase tracking-wide mb-2">
            Key differences
          </p>
          <div className="flex flex-wrap gap-1.5">
            {key_differences.map((d, i) => (
              <span
                key={i}
                className="text-[13px] px-2 py-1 rounded-full bg-[rgba(255,59,48,0.08)] text-[#c41a0f]"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      )}

      {recommendation_rationale && (
        <div>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-[15px] font-medium text-[var(--cc-accent)] hover:opacity-80"
          >
            {expanded ? 'Hide rationale' : 'Show rationale'}
          </button>
          {expanded && (
            <p className="mt-3 text-[15px] text-[var(--cc-label-secondary)] leading-relaxed bg-[var(--cc-bg)] rounded-[var(--cc-radius-md)] p-4">
              {recommendation_rationale}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
