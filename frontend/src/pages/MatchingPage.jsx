import PageContainer from '../components/layout/PageContainer'
import ErrorAlert from '../components/common/ErrorAlert'
import LoadingSpinner from '../components/common/LoadingSpinner'
import SyllabusForm from '../components/matching/SyllabusForm'
import MatchResultsList from '../components/matching/MatchResultsList'
import useMatch from '../hooks/useMatch'

export default function MatchingPage() {
  const { result, loading, error, reset, runMatchCustom } = useMatch()

  const handleSubmit = (formData) => {
    reset()
    runMatchCustom(formData)
  }

  return (
    <PageContainer
      title="Match a Course"
      subtitle="Submit course information to find equivalent Duke courses"
    >
      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <SyllabusForm onSubmit={handleSubmit} loading={loading} />
        </div>
        <div>
          {error && <ErrorAlert message={error} onDismiss={reset} />}
          {loading && <LoadingSpinner message="Analyzing syllabus and finding matches..." />}
          {!loading && result && <MatchResultsList result={result} />}
          {!loading && !result && !error && (
            <div className="bg-white rounded-lg border border-dashed border-slate-300 p-12 text-center">
              <p className="text-slate-400 text-sm">
                Fill in the course details and click "Find Matching Courses" to see results here.
              </p>
              <p className="text-slate-300 text-xs mt-2">
                Tip: Knowledge points have the highest impact on matching accuracy (35% weight).
              </p>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  )
}
