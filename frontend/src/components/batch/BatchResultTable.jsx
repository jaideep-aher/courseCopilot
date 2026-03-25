import { useState } from 'react'
import Badge from '../common/Badge'
import ScoreBar from '../common/ScoreBar'
import MatchResultCard from '../matching/MatchResultCard'

export default function BatchResultTable({ results }) {
  const [expandedIdx, setExpandedIdx] = useState(null)

  if (!results || results.length === 0) {
    return <p className="text-sm text-slate-500 py-8 text-center">No results yet.</p>
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left py-3 px-4 font-medium text-slate-500">Source Course</th>
            <th className="text-left py-3 px-4 font-medium text-slate-500">Best Match (Duke)</th>
            <th className="text-left py-3 px-4 font-medium text-slate-500 w-40">Score</th>
            <th className="text-center py-3 px-4 font-medium text-slate-500">Confidence</th>
            <th className="text-right py-3 px-4 font-medium text-slate-500">Details</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, idx) => {
            const source = r.source_course
            const bestMatch = r.top_matches?.[0]
            const isExpanded = expandedIdx === idx

            return (
              <tr key={idx} className="group">
                <td colSpan={5} className="p-0">
                  <div
                    className="grid grid-cols-[1fr_1fr_10rem_6rem_5rem] items-center border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                  >
                    <div className="py-3 px-4">
                      <p className="font-medium text-slate-800 truncate">{source.course_title}</p>
                      <p className="text-xs text-slate-400">{source.category?.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="py-3 px-4">
                      {bestMatch ? (
                        <p className="text-slate-700 truncate">{bestMatch.target_course.course_title}</p>
                      ) : (
                        <p className="text-slate-400 italic">No match</p>
                      )}
                    </div>
                    <div className="py-3 px-4">
                      {bestMatch ? <ScoreBar percentage={bestMatch.similarity_percentage} /> : '—'}
                    </div>
                    <div className="py-3 px-4 text-center">
                      {bestMatch ? (
                        <Badge variant={bestMatch.confidence_level}>{bestMatch.confidence_level}</Badge>
                      ) : '—'}
                    </div>
                    <div className="py-3 px-4 text-right">
                      <span className="text-xs text-blue-600 font-medium">
                        {isExpanded ? 'Hide' : 'Show'}
                      </span>
                    </div>
                  </div>

                  {isExpanded && r.top_matches?.length > 0 && (
                    <div className="bg-slate-50 p-4 border-b border-slate-200 space-y-3">
                      {r.top_matches.map((match, mi) => (
                        <MatchResultCard key={mi} match={match} rank={mi + 1} />
                      ))}
                      {r.evaluation_notes && (
                        <p className="text-xs text-slate-500 italic">{r.evaluation_notes}</p>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
