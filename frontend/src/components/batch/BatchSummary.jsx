import StatCard from '../common/StatCard'

export default function BatchSummary({ result }) {
  if (!result) return null

  const { summary } = result
  if (!summary) return null

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        label="Courses Evaluated"
        value={summary.total_courses_evaluated}
        color="blue"
      />
      <StatCard
        label="Matches Found"
        value={summary.courses_with_matches}
        color="green"
      />
      <StatCard
        label="High Confidence"
        value={summary.high_confidence_matches}
        color="purple"
      />
      <StatCard
        label="Processing Time"
        value={`${summary.processing_time_seconds}s`}
        color="amber"
      />
    </div>
  )
}
