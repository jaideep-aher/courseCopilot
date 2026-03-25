import MatchResultCard from './MatchResultCard'
import Badge from '../common/Badge'

export default function MatchResultsList({ result }) {
  if (!result) return null

  const { source_course, top_matches, best_match_found, evaluation_notes, missing_info_warning } = result

  return (
    <div className="space-y-4">
      {/* Source course summary */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
        <p className="text-xs font-medium text-blue-600 mb-1">Source Course</p>
        <h3 className="font-semibold text-slate-900">{source_course.course_title}</h3>
        <div className="flex gap-1.5 mt-1.5">
          <Badge>{source_course.university}</Badge>
          <Badge>{source_course.category?.replace(/_/g, ' ')}</Badge>
        </div>
        {source_course.main_topics?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {source_course.main_topics.slice(0, 8).map((t, i) => (
              <span key={i} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Warnings */}
      {missing_info_warning && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
          {missing_info_warning}
        </div>
      )}

      {/* Results header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">
          {top_matches.length > 0 ? `Top ${top_matches.length} Matches` : 'No Matches Found'}
        </h3>
        {evaluation_notes && (
          <p className="text-xs text-slate-500 max-w-xs text-right">{evaluation_notes}</p>
        )}
      </div>

      {/* Match cards */}
      {top_matches.length > 0 ? (
        top_matches.map((match, i) => (
          <MatchResultCard key={i} match={match} rank={i + 1} />
        ))
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
          <p className="text-slate-500">No suitable matches found in the Duke catalog.</p>
          <p className="text-xs text-slate-400 mt-1">Try adding more knowledge points or a description.</p>
        </div>
      )}
    </div>
  )
}
