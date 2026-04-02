import StatCard from '../common/StatCard'

export default function BatchSummary({ result }) {
  if (!result) return null

  const { summary } = result
  if (!summary) return null

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard label="Courses evaluated" value={summary.total_courses_evaluated} />
      <StatCard label="Matches found" value={summary.courses_with_matches} />
      <StatCard label="High confidence" value={summary.high_confidence_matches} />
      <StatCard label="Processing time" value={`${summary.processing_time_seconds}s`} />
    </div>
  )
}
