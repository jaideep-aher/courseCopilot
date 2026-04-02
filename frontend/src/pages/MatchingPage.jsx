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
      title="Custom syllabus match"
      subtitle="Enter course details manually when the class is not in the preloaded catalog."
      breadcrumbs={[{ to: '/workbench', label: 'Workbench' }, { label: 'Custom syllabus' }]}
    >
      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <SyllabusForm onSubmit={handleSubmit} loading={loading} />
        </div>
        <div>
          {error && <ErrorAlert message={error} onDismiss={reset} />}
          {loading && <LoadingSpinner message="Analyzing syllabus and finding matches…" />}
          {!loading && result && <MatchResultsList result={result} />}
          {!loading && !result && !error && (
            <div className="cc-card p-12 text-center" style={{ borderStyle: 'dashed' }}>
              <p className="cc-footnote text-[var(--cc-label)]">
                Fill in the course details and tap Find matching courses to see results here.
              </p>
              <p className="cc-footnote mt-4 leading-relaxed">
                Tip: knowledge points have strong weight in the local matcher — include outcomes and topics when
                possible.
              </p>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  )
}
