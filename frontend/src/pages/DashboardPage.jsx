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
    title: 'Browse Courses',
    desc: 'Explore all courses in the dataset by university and category',
  },
  {
    to: '/match',
    title: 'Match a Syllabus',
    desc: 'Submit a course syllabus and find equivalent Duke courses',
  },
  {
    to: '/batch',
    title: 'Batch Evaluation',
    desc: 'Evaluate multiple Houston courses against Duke catalog at once',
  },
]

export default function DashboardPage() {
  const { stats, loading, error } = useStatistics()

  if (loading) return <LoadingSpinner message="Loading dashboard..." />
  if (error) return <PageContainer><ErrorAlert message={error} /></PageContainer>

  const unis = stats?.by_university || {}

  return (
    <PageContainer
      title="Transfer Credit Evaluation Dashboard"
      subtitle="Houston to Duke course matching engine powered by local ML models"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Courses" value={stats?.total_courses || 0} color="blue" />
        <StatCard label="Houston Courses" value={unis.Houston || 0} color="amber" />
        <StatCard label="Duke Courses" value={unis.Duke || 0} color="purple" />
        <StatCard
          label="Categories"
          value={Object.keys(stats?.by_category || {}).length}
          color="green"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <UniversityChart byUniversity={stats?.by_university} />
        <CategoryBreakdown byCategory={stats?.by_category} totalCourses={stats?.total_courses} />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {quickActions.map(({ to, title, desc }) => (
            <Link
              key={to}
              to={to}
              className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 hover:shadow-md hover:border-blue-300 transition-all group"
            >
              <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                {title}
              </h3>
              <p className="text-sm text-slate-500 mt-1">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </PageContainer>
  )
}
