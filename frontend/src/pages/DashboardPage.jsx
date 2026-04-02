import { Link } from 'react-router-dom'
import PageContainer from '../components/layout/PageContainer'
import StatCard from '../components/common/StatCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorAlert from '../components/common/ErrorAlert'
import UniversityChart from '../components/dashboard/UniversityChart'
import CategoryBreakdown from '../components/dashboard/CategoryBreakdown'
import useStatistics from '../hooks/useStatistics'

const quickActions = [
  {
    to: '/courses',
    title: 'Browse catalog',
    desc: 'Filter by university, search titles, and open course detail.',
  },
  {
    to: '/catalog-match',
    title: 'Quick match',
    desc: 'Match one source catalog course against any target university.',
  },
  {
    to: '/match',
    title: 'Custom syllabus',
    desc: 'Enter syllabus fields manually for a one-off comparison.',
  },
  {
    to: '/batch',
    title: 'Batch evaluation',
    desc: 'Run many source courses against the target catalog in one pass.',
  },
  {
    to: '/transcript',
    title: 'Transcript upload',
    desc: 'PDF transcript workflow when the pipeline is configured.',
  },
  {
    to: '/resources',
    title: 'Resources',
    desc: 'Workflow guide, tips, and links to API documentation.',
  },
]

export default function DashboardPage() {
  const { stats, loading, error } = useStatistics()

  if (loading) return <LoadingSpinner message="Loading dashboard…" />
  if (error)
    return (
      <PageContainer title="Dashboard" breadcrumbs={[{ to: '/workbench', label: 'Workbench' }, { label: 'Dashboard' }]}>
        <ErrorAlert message={error} />
      </PageContainer>
    )

  const unis = stats?.by_university || {}

  return (
    <PageContainer
      title="Dashboard"
      subtitle="Live statistics from the dataset loaded in your API. Use this as a sanity check before running matches."
      breadcrumbs={[{ to: '/workbench', label: 'Workbench' }, { label: 'Dashboard' }]}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total courses" value={stats?.total_courses || 0} />
        <StatCard label="Source (Houston)" value={unis.Houston || 0} />
        <StatCard label="Target (Duke)" value={unis.Duke || 0} />
        <StatCard label="Categories" value={Object.keys(stats?.by_category || {}).length} />
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-12">
        <UniversityChart byUniversity={stats?.by_university} />
        <CategoryBreakdown byCategory={stats?.by_category} totalCourses={stats?.total_courses} />
      </div>

      <div>
        <h2 className="cc-title-2 font-display mb-5">Quick actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map(({ to, title, desc }) => (
            <Link
              key={to}
              to={to}
              className="cc-card p-6 transition-all duration-200 hover:shadow-[var(--cc-shadow-card-hover)] hover:border-transparent"
            >
              <h3 className="cc-title-3 font-display">{title}</h3>
              <p className="cc-footnote mt-2 leading-relaxed">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </PageContainer>
  )
}
