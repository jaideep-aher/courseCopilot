import { useState } from 'react'
import Badge from '../common/Badge'
import ScoreBar from '../common/ScoreBar'
import MatchResultCard from '../matching/MatchResultCard'

export default function BatchResultTable({ results }) {
  const [expandedIdx, setExpandedIdx] = useState(null)

  if (!results || results.length === 0) {
    return <p className="cc-footnote py-12 text-center">No results yet.</p>
  }

  return (
    <div className="cc-card overflow-hidden">
      <table className="w-full text-[15px]">
        <thead>
          <tr className="bg-[var(--cc-bg)] border-b border-[var(--cc-separator)]">
            <th className="text-left py-3 px-4 font-medium text-[var(--cc-label-secondary)]">Source course</th>
            <th className="text-left py-3 px-4 font-medium text-[var(--cc-label-secondary)]">Best match</th>
            <th className="text-left py-3 px-4 font-medium text-[var(--cc-label-secondary)] w-40">Score</th>
            <th className="text-center py-3 px-4 font-medium text-[var(--cc-label-secondary)]">Confidence</th>
            <th className="text-right py-3 px-4 font-medium text-[var(--cc-label-secondary)]"> </th>
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
                    className="grid grid-cols-[1fr_1fr_10rem_6rem_5rem] items-center border-b border-[var(--cc-border)] hover:bg-[var(--cc-bg)] transition-colors cursor-pointer"
                    onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                  >
                    <div className="py-3 px-4">
                      <p className="font-medium text-[var(--cc-label)] truncate">{source.course_title}</p>
                      <p className="text-[13px] text-[var(--cc-label-secondary)]">
                        {source.category?.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div className="py-3 px-4">
                      {bestMatch ? (
                        <p className="text-[var(--cc-label)] truncate">{bestMatch.target_course.course_title}</p>
                      ) : (
                        <p className="text-[var(--cc-label-secondary)] italic">No match</p>
                      )}
                    </div>
                    <div className="py-3 px-4">
                      {bestMatch ? <ScoreBar percentage={bestMatch.similarity_percentage} /> : '—'}
                    </div>
                    <div className="py-3 px-4 text-center">
                      {bestMatch ? (
                        <Badge variant={bestMatch.confidence_level}>{bestMatch.confidence_level}</Badge>
                      ) : (
                        '—'
                      )}
                    </div>
                    <div className="py-3 px-4 text-right">
                      <span className="text-[13px] font-medium text-[var(--cc-accent)]">
                        {isExpanded ? 'Hide' : 'Show'}
                      </span>
                    </div>
                  </div>

                  {isExpanded && r.top_matches?.length > 0 && (
                    <div className="bg-[var(--cc-bg)] p-5 border-b border-[var(--cc-border)] space-y-4">
                      {r.top_matches.map((match, mi) => (
                        <MatchResultCard key={mi} match={match} rank={mi + 1} />
                      ))}
                      {r.evaluation_notes && (
                        <p className="text-[13px] text-[var(--cc-label-secondary)] italic">{r.evaluation_notes}</p>
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
