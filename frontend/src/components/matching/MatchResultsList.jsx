import MatchResultCard from './MatchResultCard'
import Badge from '../common/Badge'

export default function MatchResultsList({ result, targetUniversity = 'Duke' }) {
  if (!result) return null

  const { source_course, top_matches, evaluation_notes, missing_info_warning } = result

  return (
    <div className="space-y-5">
      <div
        className="rounded-[var(--cc-radius-lg)] border p-6"
        style={{
          background: 'rgba(0, 113, 227, 0.06)',
          borderColor: 'rgba(0, 113, 227, 0.12)',
        }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--cc-accent)] mb-2">
          Source course
        </p>
        <h3 className="cc-title-3 font-display text-[19px]">{source_course.course_title}</h3>
        <div className="flex flex-wrap gap-1.5 mt-3">
          <Badge>{source_course.university}</Badge>
          <Badge>{source_course.category?.replace(/_/g, ' ')}</Badge>
        </div>
        {source_course.main_topics?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {source_course.main_topics.slice(0, 8).map((t, i) => (
              <span
                key={i}
                className="text-[13px] px-2.5 py-1 rounded-full bg-[var(--cc-surface)] border border-[var(--cc-border)] text-[var(--cc-label)]"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {missing_info_warning && (
        <div
          className="rounded-[var(--cc-radius-md)] p-4 text-[15px] border"
          style={{
            background: 'rgba(255, 149, 0, 0.08)',
            borderColor: 'rgba(255, 149, 0, 0.2)',
            color: '#b45309',
          }}
        >
          {missing_info_warning}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <h3 className="cc-title-3">
          {top_matches.length > 0 ? `Top ${top_matches.length} matches` : 'No matches found'}
        </h3>
        {evaluation_notes && (
          <p className="cc-footnote max-w-md sm:text-right">{evaluation_notes}</p>
        )}
      </div>

      {top_matches.length > 0 ? (
        top_matches.map((match, i) => <MatchResultCard key={i} match={match} rank={i + 1} />)
      ) : (
        <div className="cc-card p-10 text-center">
          <p className="text-[17px] text-[var(--cc-label)]">No suitable matches in the {targetUniversity} catalog.</p>
          <p className="cc-footnote mt-2">Add knowledge points or a fuller description and try again.</p>
        </div>
      )}
    </div>
  )
}
